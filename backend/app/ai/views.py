import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai
import json
import httpx
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
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

def _is_valid_human_text(text: str, min_alpha_ratio: float = 0.25) -> bool:
    """
    Checks whether extracted text is genuine human-readable content (not binary garbage,
    hex streams, font tables or PDF bytecode that slipped through the decompressor).
    Returns False for any text that is mostly non-alphabetic, so the OCR pipeline kicks in.
    """
    if not text or len(text.strip()) < 20:
        return False
    t = text.strip()
    # Count printable ASCII + accented Latin chars
    printable = sum(1 for c in t if ord(c) >= 32 and (ord(c) <= 126 or 160 <= ord(c) <= 591))
    if printable / len(t) < 0.70:
        return False
    # Require a minimum share of real alphabetic characters
    alpha = sum(1 for c in t if c.isalpha())
    if alpha / len(t) < min_alpha_ratio:
        return False
    # Reject hex-encoded binary blobs (long runs of hex digits with no spaces)
    import re as _re_validate
    hex_runs = _re_validate.findall(r'[0-9A-Fa-f]{20,}', t)
    hex_total = sum(len(r) for r in hex_runs)
    if hex_total / len(t) > 0.35:
        return False
    # Require at least 3 recognisable word-like tokens
    words = _re_validate.findall(r'[a-zA-ZÀ-ÿ]{3,}', t)
    if len(words) < 3:
        return False
    return True


def _gemini_key():
    key = getattr(settings, 'GEMINI_API_KEY', '')
    # Accept all key formats including AQ. (Gemini API keys from Google AI Studio)
    if key and key.strip():
        try:
            genai.configure(api_key=key.strip())
        except Exception:
            pass
        return key.strip()
    return ''


def _format_groq_prompt(prompt: str) -> str:
    """
    Format and compact prompt specifically for Groq on-demand tier.
    Hard TPM limit: 8000 tokens/min ≈ ~5500 chars safe margin.
    Extracts head (facts, parties) + tail (dispositif, orders) to stay well under quota.
    """
    MAX_CHARS = 5000  # ~3500 tokens — safe margin under the 8000 TPM limit
    if len(prompt) <= MAX_CHARS:
        return prompt
    head = prompt[:2800]
    tail = prompt[-2000:]
    return f"{head}\n\n[... MOTIFS INTERMEDIAIRES NON REPRODUITS - SYNTHESE LPU ...]\n\n{tail}"


def _try_gemini(prompt: str, history: list, system: str = SYSTEM_INSTRUCTION):
    """
    Attempt Gemini via direct REST API (not SDK) for maximum compatibility on Railway.
    Uses httpx with automatic model fallback. Max output: 16000 tokens for full document analysis.
    """
    key = _gemini_key()
    if not key:
        return None, 'Gemini API key not configured.'

    models = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.1-flash-image',
    ]
    last_err = None

    # Build Gemini REST history format
    gemini_history = []
    if history and isinstance(history, list):
        for h in history[-6:]:
            role = h.get('role', 'user')
            if role in ('model', 'assistant'):
                role = 'model'
            else:
                role = 'user'
            parts = h.get('parts', [])
            txt = ''
            if parts and isinstance(parts, list):
                txt = parts[0].get('text', '') if isinstance(parts[0], dict) else str(parts[0])
            if txt:
                gemini_history.append({'role': role, 'parts': [{'text': txt[:4000]}]})

    contents = gemini_history + [{'role': 'user', 'parts': [{'text': prompt}]}]

    for model_name in models:
        try:
            with httpx.Client(timeout=40) as client:
                res = client.post(
                    f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}',
                    headers={'Content-Type': 'application/json'},
                    json={
                        'system_instruction': {'parts': [{'text': system[:16000]}]},
                        'contents': contents,
                        'generationConfig': {
                            'temperature': 0.35,
                            'maxOutputTokens': 16000,
                            'topP': 0.95,
                        }
                    }
                )
            if res.status_code == 200:
                data = res.json()
                text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if text:
                    return text, None
            elif res.status_code in (429, 402, 401):
                last_err = f'Gemini {model_name}: quota/auth HTTP {res.status_code}'
                break  # Key exhausted — stop trying models
            elif res.status_code == 503:
                last_err = f'Gemini {model_name}: 503 surcharge temporaire'
                continue
            else:
                last_err = f'Gemini {model_name}: HTTP {res.status_code}'
                continue
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
            with httpx.Client(timeout=25) as client:
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
        with httpx.Client(timeout=40) as client:
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

@csrf_exempt
@ratelimit(key='ip', rate='120/m', block=False)
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
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
    model = request.data.get('model', 'openai/gpt-oss-120b')
    max_tokens = int(request.data.get('max_tokens', 4000))
    temperature = float(request.data.get('temperature', 0.2))

    # Support full length legal documents with strict DLP & RGPD sanitization
    prompt = sanitize_sensitive_data_dlp(prompt[:250000])
    system_prompt = system_prompt[:16000]
    groq_prompt = _format_groq_prompt(prompt)

    models_to_try = [model, 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for attempt_model in models_to_try:
        try:
            with httpx.Client(timeout=20) as client:
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
                            {'role': 'user', 'content': groq_prompt},
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
            elif res.status_code in [413, 429]:
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

@csrf_exempt
@ratelimit(key='ip', rate='120/m', block=False)
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
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
                groq_prompt = _format_groq_prompt(prompt)
                groq_models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
                for g_model in groq_models:
                    try:
                        with httpx.Client(timeout=20) as client:
                            res = client.post(
                                'https://api.groq.com/openai/v1/chat/completions',
                                headers={'Authorization': f'Bearer {groq_key}', 'Content-Type': 'application/json'},
                                json={
                                    'model': g_model,
                                    'messages': [
                                        {'role': 'system', 'content': system_prompt},
                                        *formatted_history,
                                        {'role': 'user', 'content': groq_prompt},
                                    ],
                                    'temperature': 0.25,
                                    'max_tokens': 8000,
                                }
                            )
                        if res.status_code == 200:
                            choice = res.json().get('choices', [{}])[0].get('message', {})
                            text = choice.get('content', '') or choice.get('reasoning', '')
                            if text:
                                return Response({'text': text, 'provider_used': 'groq', 'model_used': g_model, 'sources_web': []})
                        elif res.status_code in [413, 429]:
                            continue
                        else:
                            errors.append(f'Groq ({g_model}): HTTP {res.status_code}')
                    except Exception as e:
                        errors.append(f'Groq ({g_model}): {str(e)}')

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
                    with httpx.Client(timeout=25) as client:
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
                    with httpx.Client(timeout=40) as client:
                        ant_headers = {
                            'x-api-key': ant_key,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json',
                        }
                        ant_ws = getattr(settings, 'ANTHROPIC_WORKSPACE_ID', '') or request.data.get('anthropic_workspace_id', '')
                        if ant_ws:
                            ant_headers['anthropic-workspace-id'] = ant_ws

                        res = client.post(
                            'https://api.anthropic.com/v1/messages',
                            headers=ant_headers,
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


# ---------------------------------------------------------------------------
# 8. Ultra-Fast Server-Side Document Parser (PDF / DOCX / TXT)
# ---------------------------------------------------------------------------

@csrf_exempt
@ratelimit(key='ip', rate='120/m', block=False)
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def parse_document_endpoint(request):
    """
    Ultra-fast server-side document text extraction for PDF, DOCX, TXT.
    Extracts 100% of text layer in 5-20ms with zero browser CDN/worker latency.
    """
    import io
    import base64

    filename = request.data.get('filename', 'document.pdf')
    base64_data = request.data.get('base64', '')
    file_obj = request.FILES.get('file')
    file_bytes = None

    if file_obj:
        filename = file_obj.name
        file_bytes = file_obj.read()
    elif base64_data:
        if ',' in base64_data:
            base64_data = base64_data.split(',', 1)[1]
        try:
            file_bytes = base64.b64decode(base64_data)
        except Exception as e:
            return Response({'error': f'Erreur décodage base64: {str(e)}'}, status=400)

    if not file_bytes:
        return Response({'error': 'Aucun fichier ni donnée base64 transmis.'}, status=400)

    extracted_text = ""
    lower_name = filename.lower()

    try:
        if lower_name.endswith('.pdf'):
            # Step 1: Ultra-fast pypdf layout mode (5-50ms)
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                pages_text = []
                for i, page in enumerate(reader.pages):
                    try:
                        txt = page.extract_text(extraction_mode="layout") or ''
                    except Exception:
                        txt = page.extract_text() or ''
                    if txt.strip():
                        pages_text.append(f"--- PAGE {i+1} ---\n{txt.strip()}")
                if pages_text:
                    extracted_text = "\n\n".join(pages_text).strip()
            except Exception:
                extracted_text = ""

            # Step 2: If pypdf extracted nothing or text appears empty/corrupted, use deep pdfplumber
            is_insufficient = len(extracted_text.strip()) < 50
            if is_insufficient:
                try:
                    import pdfplumber
                    pages_text = []
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        for i, page in enumerate(pdf.pages):
                            txt = page.extract_text(x_tolerance=3, y_tolerance=3) or ''
                            if txt.strip():
                                pages_text.append(f"--- PAGE {i+1} ---\n{txt.strip()}")
                    if pages_text:
                        extracted_text = "\n\n".join(pages_text).strip()
                except Exception:
                    pass

            # Step 3: Post-process and sanitize text
            if extracted_text:
                import re as _re
                extracted_text = extracted_text.replace('\x00', '').replace('\ufffd', '')
                extracted_text = _re.sub(r'([a-zà-ÿ])([A-ZÀ-Ÿ])', r'\1 \2', extracted_text)
                extracted_text = _re.sub(r'\n{4,}', '\n\n\n', extracted_text)
                # Reject binary/garbled text — treat as empty to trigger OCR
                if not _is_valid_human_text(extracted_text):
                    extracted_text = ""

        elif lower_name.endswith('.docx') or lower_name.endswith('.doc'):
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                for table in doc.tables:
                    for row in table.rows:
                        row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                        if row_text:
                            paragraphs.append(row_text)
                extracted_text = "\n\n".join(paragraphs).strip()
            except Exception:
                extracted_text = file_bytes.decode('utf-8', errors='ignore')

        else:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')

    except Exception as e:
        return Response({'error': f"Erreur lors de l'extraction: {str(e)}"}, status=500)

    return Response({
        'filename': filename,
        'text': extracted_text,
        'character_count': len(extracted_text),
        'is_empty': len(extracted_text.strip()) < 10
    }, status=200)



# ---------------------------------------------------------------------------
# 9. Server-Side Vision OCR for Scanned PDFs
# ---------------------------------------------------------------------------

@csrf_exempt
@ratelimit(key="ip", rate="30/m", block=False)
@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def ocr_document_endpoint(request):
    """
    Server-side OCR for scanned PDF documents.
    Extracts embedded images from PDF pages via pypdf and native byte scanning,
    then transcribes via Vision AI (Gemini REST -> Anthropic Claude -> OpenAI GPT-4o).
    """
    import io
    import base64

    filename = request.data.get("filename", "document.pdf")
    base64_data = request.data.get("base64", "")
    file_obj = request.FILES.get("file")
    file_bytes = None
    max_pages = min(int(request.data.get("max_pages", 8)), 10)  # Cap at 10 pages to prevent timeout

    if file_obj:
        filename = file_obj.name
        file_bytes = file_obj.read()
    elif base64_data:
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]
        try:
            file_bytes = base64.b64decode(base64_data)
        except Exception as e:
            return Response({"error": f"Erreur décodage base64: {str(e)}"}, status=400)

    if not file_bytes:
        return Response({"error": "Aucun fichier transmis."}, status=400)

    lower_name = filename.lower()
    ocr_prompt = (
        "Vous êtes un module OCR juridique d'élite de France Justice. "
        "Transcrivez INTÉGRALEMENT tout le texte visible dans ce document juridique numérisé : "
        "juridiction, chambre, noms complets des parties, âges, situations et professions, dates, numéro de RG, "
        "exposé du litige, motifs du juge, montants exacts en euros (€), pensions alimentaires, "
        "prestations compensatoires, dépens, article 700 du CPC, et l'intégralité du dispositif (PAR CES MOTIFS). "
        "Ne résumez RIEN. Restituez le texte fidèlement et exhaustivement, ligne par ligne."
    )

    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    anthropic_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    openai_key = getattr(settings, "OPENAI_API_KEY", "")

    # ─────────────────────────────────────────────────────────────────────
    # STRATEGY 1 (PRIORITAIRE): Envoyer le PDF ENTIER directement à Gemini.
    # Gemini 1.5+ accepte application/pdf en inline_data — exactement comme
    # Claude traite les PDF. Pas d'extraction d'images, pas de conversion.
    # Fonctionne sur PDF scannés, manuscrits, numériques.
    # ─────────────────────────────────────────────────────────────────────
    if gemini_key and lower_name.endswith(".pdf"):
        pdf_b64 = base64.b64encode(file_bytes).decode("utf-8")
        # Utiliser les modèles texte/multimodaux qui acceptent PDF inline
        # (les modèles -image sont quota-épuisés; gemini-3.1-flash-lite supporte bien vision)
        pdf_gemini_models = [
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest",
            "gemini-3.8-flash",
            "gemini-3.1-flash-image",
        ]
        for g_model in pdf_gemini_models:
            try:
                with httpx.Client(timeout=60) as client:
                    res = client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={gemini_key}",
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [{"parts": [
                                {"text": ocr_prompt},
                                {"inline_data": {"mime_type": "application/pdf", "data": pdf_b64}}
                            ]}],
                            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8000}
                        }
                    )
                if res.status_code == 200:
                    t = res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    if t and len(t) > 20:
                        return Response({
                            "filename": filename,
                            "text": t,
                            "character_count": len(t),
                            "pages_processed": 1,
                            "is_empty": False,
                            "provider_used": f"gemini-pdf-direct/{g_model}"
                        }, status=200)
                elif res.status_code in (429, 402, 401):
                    break  # quota épuisé sur cette clé — passer à la stratégie suivante
                # 503 ou autre → essayer le modèle suivant
            except Exception:
                continue

    # ─────────────────────────────────────────────────────────────────────
    # STRATEGY 2: Envoi image brute directe (images et PDFs non-PDF inline)
    # ─────────────────────────────────────────────────────────────────────
    page_contents = []  # list of tuples: ('text', str) or ('image', bytes)

    if not lower_name.endswith(".pdf"):
        # It's an image file (.png, .jpg, etc.)
        page_contents = [("image", file_bytes)]
    else:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            num_pages = min(len(reader.pages), max_pages)

            for page_num in range(num_pages):
                page = reader.pages[page_num]
                # 1. Try digital text extraction first (only if text is genuine human text, not binary)
                try:
                    native_text = page.extract_text(extraction_mode="layout") or ""
                    if native_text.strip() and len(native_text.strip()) > 35 and _is_valid_human_text(native_text):
                        page_contents.append(("text", native_text.strip()))
                        continue
                except Exception:
                    pass

                # 2. Try extracting images via pypdf page.images
                found_img = False
                try:
                    if hasattr(page, "images") and page.images:
                        for img_obj in page.images:
                            if hasattr(img_obj, "data") and img_obj.data and len(img_obj.data) > 4000:
                                page_contents.append(("image", img_obj.data))
                                found_img = True
                                break
                except Exception:
                    pass

                if not found_img:
                    page_contents.append(("text", ""))

        except Exception as e:
            return Response({"error": f"Erreur lecture PDF: {str(e)}"}, status=500)

        # Fallback: If no images were extracted from PDF pages via pypdf, scan JPEG byte streams
        all_empty = all(c_type == 'text' and not c_data for c_type, c_data in page_contents)
        if all_empty or not page_contents:
            raw_jpegs = []
            idx = 0
            flen = len(file_bytes)
            while idx < flen - 4 and len(raw_jpegs) < max_pages:
                if file_bytes[idx] == 0xFF and file_bytes[idx+1] == 0xD8 and file_bytes[idx+2] == 0xFF:
                    start = idx
                    idx += 3
                    end = -1
                    while idx < flen - 1:
                        if file_bytes[idx] == 0xFF and file_bytes[idx+1] == 0xD9:
                            end = idx + 2
                            break
                        idx += 1
                    if end != -1 and (end - start) > 7000:
                        raw_jpegs.append(file_bytes[start:end])
                else:
                    idx += 1
            if raw_jpegs:
                page_contents = [("image", j) for j in raw_jpegs]

    gemini_models = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest",
                     "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"]
    page_texts = []

    for idx, (content_type, content_data) in enumerate(page_contents):
        page_num = idx + 1
        page_text = ""

        if content_type == "text":
            if content_data.strip():
                page_texts.append(f"--- PAGE {page_num} ---\n{content_data.strip()}")
            continue

        img_bytes = content_data
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")

        # Provider 1: Gemini Vision REST API (direct HTTP, supports AQ. keys)
        if gemini_key:
            for g_model in gemini_models:
                try:
                    with httpx.Client(timeout=35) as client:
                        res = client.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={gemini_key}",
                            headers={"Content-Type": "application/json"},
                            json={
                                "contents": [{"parts": [
                                    {"text": ocr_prompt},
                                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
                                ]}],
                                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4000}
                            }
                        )
                    if res.status_code == 200:
                        t = res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if t and len(t) > 15:
                            page_text = t
                            break
                    elif res.status_code in [429, 402, 401]:
                        break
                except Exception:
                    continue

        # Provider 2: Anthropic Claude Vision
        if not page_text and anthropic_key:
            for c_model in ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"]:
                try:
                    with httpx.Client(timeout=40) as client:
                        res = client.post(
                            "https://api.anthropic.com/v1/messages",
                            headers={
                                "x-api-key": anthropic_key,
                                "anthropic-version": "2023-06-01",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": c_model,
                                "max_tokens": 4000,
                                "messages": [{"role": "user", "content": [
                                    {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64}},
                                    {"type": "text", "text": ocr_prompt}
                                ]}]
                            }
                        )
                    if res.status_code == 200:
                        content_list = res.json().get("content", [])
                        t = "".join(c.get("text", "") for c in content_list if c.get("type") == "text").strip()
                        if t and len(t) > 15:
                            page_text = t
                            break
                except Exception:
                    continue

        # Provider 3: OpenAI GPT-4o Vision
        if not page_text and openai_key:
            try:
                with httpx.Client(timeout=35) as client:
                    res = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {openai_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [{"role": "user", "content": [
                                {"type": "text", "text": ocr_prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}", "detail": "high"}}
                            ]}],
                            "max_tokens": 3500
                        }
                    )
                if res.status_code == 200:
                    page_text = res.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            except Exception:
                pass

        if page_text:
            page_texts.append(f"--- PAGE {page_num} ---\n{page_text}")

    if not page_texts:
        return Response({"error": "OCR non disponible pour ce document numérisé.", "is_empty": True}, status=200)

    full_text = "\n\n".join(page_texts)
    return Response({
        "filename": filename,
        "text": full_text,
        "character_count": len(full_text),
        "pages_processed": len(page_texts)
    }, status=200)
