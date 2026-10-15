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
from .diagnostic_engine import perform_legal_case_analysis, perform_contract_analysis

# ---------------------------------------------------------------------------
# Shared system prompt
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """
Vous êtes l'Assistant IA Expert de France Justice, la plateforme juridique n°1 au Maroc et en France.

## VOTRE IDENTITÉ
- Nom : France Justice IA
- Rôle : Expert juridique IA avec accès à Internet en temps réel
- Spécialité : Droit marocain, droit français, droit international
- Niveau : Expertise professionnelle équivalente à un avocat senior de grand cabinet

## VOS CAPACITÉS
1. **Recherche Internet en temps réel** : Utilisez les sources officielles et la jurisprudence la plus récente.
2. **Analyse de documents juridique avancée** : Analyse exhaustive, point par point, de 100% du contenu des documents transmis.
3. **Génération d'actes et de stratégie** : Conseil stratégique clair, percutant et immédiatement exploitable.

## RÈGLES CRITIQUES D'ANALYSE DE DOCUMENTS (AUCUN RÉSUMÉ, EXHAUSTIVITÉ ABSOLUE)
LORSQU'UN DOCUMENT EST FOURNI OU QU'UNE ANALYSE DE PIÈCE EST DEMANDÉE (CONTRAT, JUGEMENT, DÉCISION, ORDONNANCE, BAIL, CONCLUSIONS, MISE EN DEMEURE, RAPPORT, ETC.) :
- INTERDICTION ABSOLUE DE DONNER UN BREF RÉSUMÉ OU UNE VUE D'ENSEMBLE SUCCINCTE. L'UTILISATEUR EXIGE L'ANALYSE COMPLÈTE DE TOUT LE DOCUMENT, DE TOUS LES ÉLÉMENTS QUI Y FIGURENT, SANS OUBLIER AUCUNE DONNÉE.
- VOUS DEVEZ TRAITER ET DÉCORTIQUER POINT PAR POINT :
  1. L'identification complète : juridiction ou rédacteur, date exacte, numéros de RG / minute, caractère contradictoire ou exécutoire, et identité de toutes les parties (avec enfants, dates de naissance et situation si applicable).
  2. L'exposé chronologique exhaustif des faits, des antécédents et des manquements allégués.
  3. Les prétentions et demandes initiales de chaque partie (principales et reconventionnelles).
  4. L'analyse juridique approfondie de TOUS les motifs et moyens de droit : chaque attendu ou clause décortiqué avec les articles de lois visés (Code Civil, Code du Travail, Code de Commerce, CPC, Dahir...).
  5. Le dispositif intégral (« PAR CES MOTIFS ») ou l'ensemble des clauses sans exception : chaque condamnation, somme chiffrée (principal, dommages-intérêts, pensions, frais d'article 700 CPC, dépens, astreintes), autorité parentale, calendrier DVH précis, clauses résolutoires ou pénales.
  6. L'audit critique : détection des erreurs matérielles, clauses abusives, omissions, forclusions ou vices de procédure.
  7. Les voies et délais de recours exacts (délais stricts, actes d'huissier/commissaire requis).
  8. Le plan d'action d'exécution pratique et stratégique.
- RÈGLE D'OR : RIEN NE DOIT ÊTRE OMIS. Chaque chiffre, date, obligation ou argument mentionné dans le document doit être traité.
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
    models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-pro-latest']
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
# 5. Universal AI Proxy  (NEW — routes to best available provider)
# ---------------------------------------------------------------------------

@ratelimit(key='ip', rate='30/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def universal_proxy(request):
    """
    Universal AI proxy: tries providers in order (Gemini → OpenAI → Anthropic).
    The frontend only needs to send prompt + optional system_prompt.
    Provider preference can be hinted via 'preferred_provider'.
    """
    prompt = request.data.get('prompt', '')
    system_prompt = request.data.get('system_prompt', SYSTEM_INSTRUCTION)
    preferred = request.data.get('preferred_provider', 'gemini')  # gemini | openai | anthropic
    history = request.data.get('history', [])

    # Support full length legal documents up to 250k characters
    prompt = prompt[:250000]
    system_prompt = system_prompt[:16000]

    errors = []

    # Build ordered provider list
    providers = [preferred] + [p for p in ['gemini', 'openai', 'anthropic'] if p != preferred]

    # Format history for OpenAI and Anthropic
    openai_history = []
    anthropic_history = []
    if history and isinstance(history, list):
        for h in history[-8:]:
            role = 'assistant' if h.get('role') in ['model', 'assistant'] else 'user'
            parts = h.get('parts', [])
            txt = parts[0].get('text', '') if (parts and isinstance(parts, list) and isinstance(parts[0], dict)) else ''
            if txt:
                openai_history.append({'role': role, 'content': txt[:4000]})
                anthropic_history.append({'role': role, 'content': txt[:4000]})

    for provider in providers:
        if provider == 'gemini' and _gemini_key():
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
                                    *openai_history,
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
                                'messages': anthropic_history + [{'role': 'user', 'content': prompt}],
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
    case_title = request.data.get('caseTitle', '') or request.data.get('case_title', '')
    user_description = request.data.get('userDescription', '') or request.data.get('user_description', '')
    extracted_text = request.data.get('extractedDocumentsText', '') or request.data.get('extracted_text', '')
    target_lang = request.data.get('targetLang', 'fr')
    uploaded_files = request.data.get('uploadedFileNames', []) or request.data.get('uploaded_files', [])

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
    contract_text = request.data.get('contractText', '') or request.data.get('contract_text', '')
    contract_type = request.data.get('contractType', 'Général') or request.data.get('contract_type', 'Général')
    target_lang = request.data.get('targetLang', 'fr')

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

