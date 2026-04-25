from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.legal_search, name='legal-search'),
    path('articles/', views.get_articles, name='get-articles'),
]
