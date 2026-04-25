from django.urls import path
from . import views

urlpatterns = [
    path('stripe-webhook/', views.stripe_webhook, name='stripe-webhook'),
    path('create-checkout/', views.create_checkout, name='create-checkout'),
]
