from django.urls import path
from . import views

urlpatterns = [
    path('jitsi-token/', views.jitsi_token, name='jitsi-token'),
]
