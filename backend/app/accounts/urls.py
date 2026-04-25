from django.urls import path
from . import views

urlpatterns = [
    path('validate-token/', views.validate_token, name='validate-token'),
]
