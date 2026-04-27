import stripe
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

stripe.api_key = settings.STRIPE_API_KEY

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return Response({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError as e:
        return Response({"error": "Invalid signature"}, status=400)

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        quote_id = session.get('metadata', {}).get('quote_id')
        payment_type = session.get('metadata', {}).get('type')

        if quote_id:
            from django.db import connection
            with connection.cursor() as cursor:
                if payment_type == 'quote_payment':
                    # Citizen paid 100% to Admin (Admin holds the money)
                    # We mark as commissioned because Admin already has their share
                    cursor.execute(
                        "UPDATE quotes SET status = 'commissioned' WHERE id = %s",
                        [quote_id]
                    )
                elif payment_type == 'commission_payment':
                    # Lawyer paid 20% commission to Admin
                    cursor.execute(
                        "UPDATE quotes SET status = 'commissioned' WHERE id = %s",
                        [quote_id]
                    )
    
    return Response({"status": "ok"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Creates a Stripe Checkout Session for:
    1. Citizen paying a lawyer (Quote)
    2. Lawyer paying the 20% commission (Platform Fee)
    """
    try:
        quote_id = request.data.get('quote_id')
        payment_type = request.data.get('type') # 'quote_payment' or 'commission_payment'
        amount = int(request.data.get('amount')) # Amount in cents
        
        success_url = request.build_absolute_uri('/dashboard?payment=success')
        cancel_url = request.build_absolute_uri('/dashboard?payment=cancel')

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'mad',
                    'product_data': {
                        'name': f"Paiement Devis #{quote_id}" if payment_type == 'quote_payment' else "Commission Plateforme",
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'quote_id': quote_id,
                'type': payment_type
            }
        )
        return Response({'url': session.url})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
