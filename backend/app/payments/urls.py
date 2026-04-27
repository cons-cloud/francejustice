from django.urls import path
from . import views

urlpatterns = [
    path('stripe-webhook/', views.stripe_webhook, name='stripe-webhook'),
    path('create-checkout-session/', views.create_checkout_session, name='create-checkout-session'),
]
