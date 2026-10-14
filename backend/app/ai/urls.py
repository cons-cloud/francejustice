from django.urls import path
from . import views

urlpatterns = [
    # Existing routes
    path('chat/', views.chat_proxy, name='ai_chat_proxy'),
    path('generate-document/', views.document_proxy, name='ai_document_proxy'),

    # New secure provider proxies
    path('openai/', views.openai_proxy, name='ai_openai_proxy'),
    path('anthropic/', views.anthropic_proxy, name='ai_anthropic_proxy'),

    # Universal proxy (auto-selects best available provider)
    path('universal/', views.universal_proxy, name='ai_universal_proxy'),

    # Python Algorithmic Legal & Contract Analysis
    path('analyze-case/', views.analyze_case_endpoint, name='ai_analyze_case'),
    path('analyze-contract/', views.analyze_contract_endpoint, name='ai_analyze_contract'),
]

