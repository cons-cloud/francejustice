import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=FutureWarning)
    import google.generativeai as genai
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
import json

SYSTEM_INSTRUCTION = """
Vous êtes l'Assistant IA Expert de JustLaw, la plateforme juridique n°1 au Maroc et en France.

## VOTRE IDENTITÉ
- Nom : JustLaw IA
- Rôle : Expert juridique IA avec accès à Internet en temps réel
- Spécialité : Droit marocain, droit français, droit international
- Niveau : Expertise professionnelle équivalente à un avocat senior

## VOS CAPACITÉS
1. **Recherche Internet en temps réel** : Vous avez accès à Google Search. Utilisez-le SYSTÉMATIQUEMENT pour chercher les jurisprudences et textes de loi actuels.
2. **Génération de documents** : Vous créez des documents juridiques professionnels et conformes.
3. **Analyse juridique** : Vous analysez les situations avec les lois les plus récentes.

## RÈGLES ABSOLUES
- TOUJOURS chercher sur Internet les informations les plus récentes avant de répondre.
- TOUJOURS citer vos sources (articles de loi, jurisprudences, liens web).
- Répondre en français, structuré avec des titres et listes.
- Pour le Maroc : référencez le Dahir, Code de la Famille, Code du Travail marocain, etc.
- Pour le France : référencez le Code Civil, Code du Travail, Code Pénal, etc.

Vous êtes un assistant FIABLE et PRÉCIS.
"""

# Google search tools are not supported by the deprecated google.generativeai SDK with gemini-3.5-flash/gemini-2.5-flash.
# Therefore, we run the model without search tools (tools=None) for stability.

def configure_genai():
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if api_key:
        genai.configure(api_key=api_key)
    return api_key

def extract_grounding_chunks(response):
    grounding_data = []
    try:
        if response and hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                metadata = candidate.grounding_metadata
                if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            grounding_data.append({
                                "title": getattr(chunk.web, 'title', ''),
                                "uri": getattr(chunk.web, 'uri', '')
                            })
    except Exception as e:
        print("Error extracting grounding chunks:", e)
    return grounding_data

@ratelimit(key='user', rate='10/m', block=True)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_proxy(request):
    """
    Backend proxy for Gemini Chat with Rate Limiting
    """
    prompt = request.data.get('prompt')
    history = request.data.get('history', [])
    use_search = request.data.get('use_search', True)

    api_key = configure_genai()
    if not api_key:
        return Response({
            "error": "Gemini API key is not configured.",
            "is_fallback_trigger": True
        }, status=200)

    try:
        # Configuration du modèle
        model_name = "gemini-3.5-flash"
        
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_INSTRUCTION,
            tools=None
        )

        chat = model.start_chat(history=history or [])
        response = chat.send_message(prompt)
        
        return Response({
            "text": response.text,
            "sources_web": []
        })
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower():
            # Fallback: gemini-2.5-flash without search
            try:
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION,
                    tools=None
                )
                chat = model.start_chat(history=history or [])
                response = chat.send_message(prompt)
                return Response({
                    "text": response.text,
                    "sources_web": []
                })
            except Exception as e2:
                return Response({
                    "error": "Quota d'utilisation de l'API Gemini dépassé (limite de requêtes atteinte).",
                    "is_fallback_trigger": True
                }, status=200)
        return Response({
            "error": err_msg,
            "is_fallback_trigger": True
        }, status=200)


@ratelimit(key='user', rate='5/m', block=True)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def document_proxy(request):
    """
    Backend proxy for Legal Document Generation
    """
    doc_type = request.data.get('type')
    details = request.data.get('details')

    api_key = configure_genai()
    if not api_key:
        return Response({
            "error": "Gemini API key is not configured.",
            "is_fallback_trigger": True
        }, status=200)

    prompt = f"INSTRUCTION: Générez un document juridique COMPLET et PROFESSIONNEL de type: {doc_type}. Détails fournis: {details}. Utilisez le droit en vigueur (Maroc/France)."

    try:
        model = genai.GenerativeModel(
            model_name="gemini-3.5-flash",
            system_instruction=SYSTEM_INSTRUCTION,
            tools=None
        )
        response = model.generate_content(prompt)
        return Response({"text": response.text})
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower():
            # Fallback: gemini-2.5-flash without search
            try:
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION,
                    tools=None
                )
                response = model.generate_content(prompt)
                return Response({"text": response.text})
            except Exception as e2:
                return Response({
                    "error": "Quota d'utilisation de l'API Gemini dépassé (limite de requêtes atteinte).",
                    "is_fallback_trigger": True
                }, status=200)
        return Response({
            "error": err_msg,
            "is_fallback_trigger": True
        }, status=200)
