import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai
import json
import httpx
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from .diagnostic_engine import (
    perform_legal_case_analysis,
    perform_contract_analysis,
    sanitize_sensitive_data_dlp,
)

# ---------------------------------------------------------------------------
# Shared system prompt
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """
Vous êtes l'Assistant IA Expert de France Justice (https://francejustice.com), la référence juridique d'excellence.

## VOTRE MISSION & RÈGLE FONDAMENTALE : ANCRAGE RÉEL DU DOCUMENT (ZÉRO PLACEHOLDER, ZÉRO FICTION)
- Vous travaillez STRICTEMENT sur les éléments réels du dossier et des documents fournis.
- Extrayez et nommez expressément les VRAIES PERSONNES et SOCIÉTÉS citées (ex: M. Dupont, SARL ABC, Me Martin, Président de Chambre...). N'employez JAMAIS de dénominations abstraites génériques comme "Partie Demanderesse" si les noms figurent dans la pièce.
- Extrayez tous les MONTANTS RÉELS en euros (€) ou devise figurant dans la pièce (principal, condamnations, Article 700 CPC, dépens, préavis, indemnités, salaires, loyers).
- Extrayez les DATES RÉELLES et la CHRONOLOGIE FACTUELLE EXACTE.

## AUDIT CRITIQUE & CAPACITÉ À JUGER
- Vous ne devez pas être un simple perroquet ou un résumé passif du document.
- Vous devez donner votre VRAI POINT DE VUE JURIDIQUE : évaluez avec fermeté si le jugement ou l'ordonnance rendu dans ce document est JURIDIQUEMENT APPROPRIÉ ou AU CONTRAIRE CONTESTABLE, DISPROPORTIONNÉ ou ENTACHÉ D'ERREUR DE DROIT.
- Identifiez les failles précises : vice de procédure, défaut de base légale, dénaturation des clauses du contrat, motivation insuffisante ou contradictoire, revirement non pris en compte.
- Donnez de vraies conclusions et une décision d'orientation claire (opportunité d'appel, pourvoi en cassation, transaction, exécution forcée).

## STRUCTURE D'ANALYSE EN 5 SECTIONS DE TOUTE DÉCISION / TOUT DOCUMENT (MODÈLE D'ÉLITE CLAUDE / FRANCE JUSTICE) :
Lorsqu'un document ou une décision est analysé, appliquez impérativement la structure directe, chirurgicale et lisible suivante :

# Analyse du [jugement / arrêt / ordonnance / contrat] du [Date exacte]
**[Juridiction : TJ, CA, JAF, CPH...] – RG [N°] – [NOM DEMANDEUR] / [NOM DÉFENDEUR]**
*Je ne suis pas juriste : cette analyse est informative et ne remplace pas l'avis d'un avocat, notamment pour les délais de recours.*

## 1. Le cadre
- Noms complets réels des parties, âges, professions, situations de revenus exactes (salaires réels, AAH, allocations).
- Durée exacte du mariage, du contrat ou de la relation.
- Enfants réels avec prénoms, statuts (majeurs avec dates exactes, mineurs).
- Saisine, assignation et fondement légal exact (articles précis de loi).

## 2. Ce que le juge a décidé [ou Ce que stipule l'acte]
Tableau Markdown à 2 colonnes exhaustif couvrant l'intégralité du dispositif (« Par ces motifs ») :
| Point | Décision |
(Prononcé principal, effets patrimoniaux et date, nom marital, avantages matrimoniaux, liquidation, prestation compensatoire accordée vs demandée, autorité parentale, résidence, droit d'accueil fixé ou réservé, pension alimentaire chiffrée par enfant et totale, dépens et article 700).

## 3. Points de fond à relever
- Analyse détaillée des motifs du juge (pourquoi cette somme précise ? confrontation des revenus réels et des charges réelles : loyers, emprunts immobiliers mensuels).
- Carence probatoire (absence de déclaration sur l'honneur art. 272, absence de justificatifs médicaux ou de carrière).
- Régime matrimonial et biens réels (prix d'achat de la maison, qualification légale).
- Enfants et mesures parentales : pièces déterminantes (ex: messages violents cités dans les pièces), audition de l'enfant.

## 4. Anomalies et incohérences du texte
(Le vrai regard critique d'avocat) :
1. Contradictions internes motifs vs dispositif (ex: condamnation à une pension pour des majeurs non demandée).
2. Formules types incompatibles (ex: pension due « pendant l'exercice du droit d'accueil » alors que ce droit est réservé).
3. Coquilles et erreurs matérielles (ex: prénom déformé, fautes d'état civil).
4. Discordances de dates (ex: date de séparation vs date d'effet patrimonial).
5. Références de pièces ou justificatifs douteux à faire vérifier par le client.

## 5. Suites possibles
- Appel : premier ressort, délai d'un mois (ou 15 jours en référé), point de départ (signification), exécution provisoire.
- Liquidation : notaire puis assignation en partage (art. 1359 CPC).
- Saisine modificative : fixation ultérieure du droit d'accueil réservé devant le JAF.
- Requête en rectification d'erreur matérielle (art. 462 CPC).

Ouverture proactive invitant à approfondir.
(Si et seulement si l'utilisateur demande explicitement un « commentaire d'arrêt universitaire », ajoutez la fiche d'arrêt et le plan I-A / I-B / II-A / II-B).
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _gemini_key():
    key = getattr(settings, 'GEMINI_API_KEY', '')
    if key:
        genai.configure(api_key=key)
    return key


def _try_gemini(prompt: str, history: list, system: str = SYSTEM_INSTRUCTION):
    """Attempt Gemini with automatic model fallback (max_output_tokens=16000 for full document analysis)."""
    models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest']
    last_err = None
    generation_config = {
        'temperature': 0.35,
        'max_output_tokens': 16000,
        'top_p': 0.95,
    }
    for model_name in models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system,
                generation_config=generation_config,
                tools=None
            )
            chat = model.start_chat(history=history or [])
            response = chat.send_message(prompt)
            if response and response.text:
                return response.text, None
        except Exception as e:
            last_err = str(e)
            continue
    return None, last_err or 'Quota d\'utilisation de l\'API Gemini dépassé.'



# ---------------------------------------------------------------------------
# 1. Gemini Chat Proxy  (existing)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def chat_proxy(request):
    """Backend proxy for Gemini Chat with Rate Limiting."""
    prompt = request.data.get('prompt')
    history = request.data.get('history', [])

    if not _gemini_key():
        return Response({
            'error': 'Gemini API key is not configured.',
            'is_fallback_trigger': True
        }, status=200)

    text, err = _try_gemini(prompt, history)
    if text:
        return Response({'text': text, 'sources_web': []})
    return Response({
        'error': err or 'Erreur Gemini inconnue.',
        'is_fallback_trigger': True
    }, status=200)


# ---------------------------------------------------------------------------
# 2. Gemini Document Generation Proxy  (existing)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='20/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def document_proxy(request):
    """Backend proxy for Legal Document Generation."""
    doc_type = request.data.get('type')
    details = request.data.get('details')

    if not _gemini_key():
        return Response({
            'error': 'Gemini API key is not configured.',
            'is_fallback_trigger': True
        }, status=200)

    prompt = (
        f'INSTRUCTION: Générez un document juridique COMPLET et PROFESSIONNEL '
        f'de type: {doc_type}. Détails fournis: {details}. '
        f'Utilisez le droit en vigueur (Maroc/France).'
    )
    text, err = _try_gemini(prompt, [], system=SYSTEM_INSTRUCTION)
    if text:
        return Response({'text': text})
    return Response({
        'error': err or 'Impossible de générer le document.',
        'is_fallback_trigger': True
    }, status=200)


# ---------------------------------------------------------------------------
# 3. OpenAI Proxy  (NEW — clé côté serveur uniquement)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def openai_proxy(request):
    """
    Secure backend proxy for OpenAI API.
    The frontend sends the prompt + optional system prompt.
    The server adds the secret key — it never reaches the browser.
    """
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        return Response({
            'error': 'OpenAI API key is not configured on the server.',
            'is_fallback_trigger': True
        }, status=200)

    prompt = request.data.get('prompt', '')
    system_prompt = request.data.get('system_prompt', SYSTEM_INSTRUCTION)
    model = request.data.get('model', 'gpt-4o-mini')
    max_tokens = int(request.data.get('max_tokens', 8000))
    temperature = float(request.data.get('temperature', 0.3))

    # Safety: support full length legal documents and judicial acts (up to 250k chars)
    prompt = prompt[:250000]
    system_prompt = system_prompt[:16000]

    models_to_try = [model, 'gpt-4o-mini', 'gpt-3.5-turbo']
    # Deduplicate while preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for attempt_model in models_to_try:
        try:
            with httpx.Client(timeout=60) as client:
                res = client.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': attempt_model,
                        'messages': [
                            {'role': 'system', 'content': system_prompt},
                            {'role': 'user', 'content': prompt},
                        ],
                        'temperature': temperature,
                        'max_tokens': max_tokens,
                    }
                )

            if res.status_code == 200:
                data = res.json()
                text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                if text:
                    return Response({'text': text, 'model_used': attempt_model})
            elif res.status_code == 429:
                # Rate limit — try next model
                continue
            else:
                return Response({
                    'error': f'OpenAI API error {res.status_code}: {res.text[:300]}',
                    'is_fallback_trigger': True
                }, status=200)

        except httpx.TimeoutException:
            continue
        except Exception as e:
            return Response({
                'error': f'OpenAI proxy error: {str(e)}',
                'is_fallback_trigger': True
            }, status=200)

    return Response({
        'error': 'OpenAI quota dépassé sur tous les modèles disponibles.',
        'is_fallback_trigger': True
    }, status=200)


# ---------------------------------------------------------------------------
# 4. Anthropic Claude Proxy  (NEW — clé côté serveur uniquement)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def anthropic_proxy(request):
    """
    Secure backend proxy for Anthropic Claude API.
    The frontend sends the prompt + optional system prompt.
    The server adds the secret key — it never reaches the browser.
    """
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
    if not api_key:
        return Response({
            'error': 'Anthropic API key is not configured on the server.',
            'is_fallback_trigger': True
        }, status=200)

    prompt = request.data.get('prompt', '')
    system_prompt = request.data.get('system_prompt', SYSTEM_INSTRUCTION)
    model = request.data.get('model', 'claude-3-5-haiku-20241022')
    max_tokens = int(request.data.get('max_tokens', 8000))

    # Safety: support full length legal documents and judicial acts (up to 250k chars)
    prompt = prompt[:250000]
    system_prompt = system_prompt[:16000]

    try:
        with httpx.Client(timeout=90) as client:
            res = client.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': model,
                    'max_tokens': max_tokens,
                    'system': system_prompt,
                    'messages': [{'role': 'user', 'content': prompt}],
                }
            )

        if res.status_code == 200:
            data = res.json()
            text = data.get('content', [{}])[0].get('text', '')
            if text:
                return Response({'text': text, 'model_used': model})
            return Response({
                'error': 'Réponse vide reçue de Claude.',
                'is_fallback_trigger': True
            }, status=200)

        return Response({
            'error': f'Anthropic API error {res.status_code}: {res.text[:300]}',
            'is_fallback_trigger': True
        }, status=200)

    except httpx.TimeoutException:
        return Response({
            'error': 'Timeout lors de l\'appel à Anthropic Claude (90s).',
            'is_fallback_trigger': True
        }, status=200)
    except Exception as e:
        return Response({
            'error': f'Anthropic proxy error: {str(e)}',
            'is_fallback_trigger': True
        }, status=200)


# ---------------------------------------------------------------------------
# 5. Groq Proxy (Ultra-rapide LPU — Qwen / GPT OSS / Llama)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='60/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def groq_proxy(request):
    """
    Secure backend proxy for Groq API (Inférence ultra-rapide en quelques millisecondes).
    """
    api_key = getattr(settings, 'GROQ_API_KEY', '')
    if not api_key:
        return Response({
            'error': 'Groq API key is not configured on the server.',
            'is_fallback_trigger': True
        }, status=200)

    prompt = request.data.get('prompt', '')
    system_prompt = request.data.get('system_prompt', SYSTEM_INSTRUCTION)
    model = request.data.get('model', 'qwen/qwen3.8-27b')
    max_tokens = int(request.data.get('max_tokens', 8000))
    temperature = float(request.data.get('temperature', 0.2))

    # Support full length legal documents with strict DLP & RGPD sanitization
    prompt = sanitize_sensitive_data_dlp(prompt[:250000])
    system_prompt = system_prompt[:16000]

    models_to_try = [model, 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for attempt_model in models_to_try:
        try:
            with httpx.Client(timeout=45) as client:
                res = client.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': attempt_model,
                        'messages': [
                            {'role': 'system', 'content': system_prompt},
                            {'role': 'user', 'content': prompt},
                        ],
                        'temperature': temperature,
                        'max_tokens': max_tokens,
                    }
                )

            if res.status_code == 200:
                data = res.json()
                choice = data.get('choices', [{}])[0].get('message', {})
                text = choice.get('content', '') or choice.get('reasoning', '')
                if text:
                    return Response({'text': text, 'model_used': attempt_model, 'provider_used': 'groq'})
            elif res.status_code == 429:
                continue
            else:
                return Response({
                    'error': f'Groq API error {res.status_code}: {res.text[:300]}',
                    'is_fallback_trigger': True
                }, status=200)

        except httpx.TimeoutException:
            continue
        except Exception as e:
            return Response({
                'error': f'Groq proxy error: {str(e)}',
                'is_fallback_trigger': True
            }, status=200)

    return Response({
        'error': 'Groq indisponible.',
        'is_fallback_trigger': True
    }, status=200)


# ---------------------------------------------------------------------------
# 6. Universal AI Proxy  (Routes to Groq / Gemini / OpenAI / Anthropic)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='60/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def universal_proxy(request):
    """
    Universal AI proxy: tries providers in order (Groq → Gemini → OpenAI → Anthropic).
    The frontend only needs to send prompt + optional system_prompt.
    Provider preference can be hinted via 'preferred_provider'.
    """
    prompt = request.data.get('prompt', '')
    system_prompt = request.data.get('system_prompt', SYSTEM_INSTRUCTION)
    preferred = request.data.get('preferred_provider', 'groq')  # groq | gemini | openai | anthropic
    history = request.data.get('history', [])

    # Support full length legal documents with strict DLP & RGPD sanitization
    prompt = sanitize_sensitive_data_dlp(prompt[:250000])
    system_prompt = system_prompt[:16000]

    errors = []

    # Build ordered provider list with Groq as ultra-fast priority
    ordered_defaults = ['groq', 'gemini', 'openai', 'anthropic']
    providers = [preferred] + [p for p in ordered_defaults if p != preferred]

    # Format history for Groq, OpenAI and Anthropic
    formatted_history = []
    if history and isinstance(history, list):
        for h in history[-8:]:
            role = 'assistant' if h.get('role') in ['model', 'assistant'] else 'user'
            parts = h.get('parts', [])
            txt = parts[0].get('text', '') if (parts and isinstance(parts, list) and isinstance(parts[0], dict)) else ''
            if txt:
                formatted_history.append({'role': role, 'content': txt[:4000]})

    for provider in providers:
        if provider == 'groq':
            groq_key = getattr(settings, 'GROQ_API_KEY', '')
            if groq_key:
                try:
                    with httpx.Client(timeout=30) as client:
                        res = client.post(
                            'https://api.groq.com/openai/v1/chat/completions',
                            headers={'Authorization': f'Bearer {groq_key}', 'Content-Type': 'application/json'},
                            json={
                                'model': 'qwen/qwen3.8-27b',
                                'messages': [
                                    {'role': 'system', 'content': system_prompt},
                                    *formatted_history,
                                    {'role': 'user', 'content': prompt},
                                ],
                                'temperature': 0.25,
                                'max_tokens': 8000,
                            }
                        )
                    if res.status_code == 200:
                        choice = res.json().get('choices', [{}])[0].get('message', {})
                        text = choice.get('content', '') or choice.get('reasoning', '')
                        if text:
                            return Response({'text': text, 'provider_used': 'groq', 'model_used': 'qwen/qwen3.8-27b', 'sources_web': []})
                    else:
                        errors.append(f'Groq: HTTP {res.status_code}')
                except Exception as e:
                    errors.append(f'Groq: {str(e)}')

        elif provider == 'gemini' and _gemini_key():
            text, err = _try_gemini(prompt, history, system=system_prompt)
            if text:
                return Response({'text': text, 'provider_used': 'gemini', 'sources_web': []})
            if err:
                errors.append(f'Gemini: {err}')

        elif provider == 'openai':
            oai_key = getattr(settings, 'OPENAI_API_KEY', '')
            if oai_key:
                try:
                    with httpx.Client(timeout=60) as client:
                        res = client.post(
                            'https://api.openai.com/v1/chat/completions',
                            headers={'Authorization': f'Bearer {oai_key}', 'Content-Type': 'application/json'},
                            json={
                                'model': 'gpt-4o-mini',
                                'messages': [
                                    {'role': 'system', 'content': system_prompt},
                                    *formatted_history,
                                    {'role': 'user', 'content': prompt},
                                ],
                                'temperature': 0.2,
                                'max_tokens': 8000,
                            }
                        )
                    if res.status_code == 200:
                        text = res.json().get('choices', [{}])[0].get('message', {}).get('content', '')
                        if text:
                            return Response({'text': text, 'provider_used': 'openai', 'sources_web': []})
                    else:
                        errors.append(f'OpenAI: HTTP {res.status_code}')
                except Exception as e:
                    errors.append(f'OpenAI: {str(e)}')

        elif provider == 'anthropic':
            ant_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
            if ant_key:
                try:
                    with httpx.Client(timeout=90) as client:
                        res = client.post(
                            'https://api.anthropic.com/v1/messages',
                            headers={
                                'x-api-key': ant_key,
                                'anthropic-version': '2023-06-01',
                                'Content-Type': 'application/json',
                            },
                            json={
                                'model': 'claude-3-5-haiku-20241022',
                                'max_tokens': 8000,
                                'system': system_prompt,
                                'messages': formatted_history + [{'role': 'user', 'content': prompt}],
                            }
                        )
                    if res.status_code == 200:
                        text = res.json().get('content', [{}])[0].get('text', '')
                        if text:
                            return Response({'text': text, 'provider_used': 'anthropic', 'sources_web': []})
                    else:
                        errors.append(f'Anthropic: HTTP {res.status_code}')
                except Exception as e:
                    errors.append(f'Anthropic: {str(e)}')

    return Response({
        'error': f'Tous les fournisseurs IA sont indisponibles. Détails: {"; ".join(errors)}',
        'is_fallback_trigger': True
    }, status=200)


# ---------------------------------------------------------------------------
# 6. Algorithmic Legal Case Analysis (Python Diagnostic Engine)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_case_endpoint(request):
    """
    Exécute l'algorithme d'analyse juridique et de diagnostic des 5 piliers
    entièrement codé en Python.
    """
    case_title = (request.data.get('caseTitle', '') or request.data.get('case_title', ''))[:500]
    user_description = (request.data.get('userDescription', '') or request.data.get('user_description', ''))[:50000]
    extracted_text = (request.data.get('extractedDocumentsText', '') or request.data.get('extracted_text', ''))[:350000]
    target_lang = (request.data.get('targetLang', 'fr'))[:10]
    uploaded_files = (request.data.get('uploadedFileNames', []) or request.data.get('uploaded_files', []))[:30]

    try:
        result = perform_legal_case_analysis(
            case_title=case_title,
            user_description=user_description,
            extracted_text=extracted_text,
            uploaded_files=uploaded_files,
            target_lang=target_lang
        )
        return Response(result, status=200)
    except Exception as e:
        return Response({
            'error': f"Erreur du moteur d'analyse juridique Python: {str(e)}",
            'is_fallback_trigger': True
        }, status=500)


# ---------------------------------------------------------------------------
# 7. Algorithmic Contract Analysis (Python Contract Engine)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_contract_endpoint(request):
    """
    Exécute l'algorithme d'audit et d'analyse de contrat en Python.
    """
    contract_text = (request.data.get('contractText', '') or request.data.get('contract_text', ''))[:350000]
    contract_type = (request.data.get('contractType', 'Général') or request.data.get('contract_type', 'Général'))[:100]
    target_lang = (request.data.get('targetLang', 'fr'))[:10]

    if not contract_text:
        return Response({'error': 'Texte du contrat manquant'}, status=400)

    try:
        result = perform_contract_analysis(
            contract_text=contract_text,
            contract_type=contract_type,
            target_lang=target_lang
        )
        return Response(result, status=200)
    except Exception as e:
        return Response({
            'error': f"Erreur du moteur d'analyse contractuelle Python: {str(e)}",
            'is_fallback_trigger': True
        }, status=500)

