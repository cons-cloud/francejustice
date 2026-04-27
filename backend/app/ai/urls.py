from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_proxy, name='ai_chat_proxy'),
    path('generate-document/', views.document_proxy, name='ai_document_proxy'),
]
