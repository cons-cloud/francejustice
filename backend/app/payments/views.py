import stripe
from django.conf import settings
from django.db import connection
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
    except ValueError:
        return Response({"error": "Invalid payload"}, status=400)
    except stripe.SignatureVerificationError:
        return Response({"error": "Invalid signature"}, status=400)

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        quote_id = session.get('metadata', {}).get('quote_id')
        payment_type = session.get('metadata', {}).get('type')

        if quote_id:
            with connection.cursor() as cursor:
                if payment_type == 'quote_payment':
                    # Citizen paid the lawyer — mark quote as paid
                    cursor.execute(
                        "UPDATE quotes_just SET status = 'paid' WHERE id = %s",
                        [quote_id]
                    )
                elif payment_type == 'commission_payment':
                    # Lawyer paid 20% commission to Admin — mark as commissioned
                    cursor.execute(
                        "UPDATE quotes_just SET status = 'commissioned' WHERE id = %s",
                        [quote_id]
                    )

    return Response({"status": "ok"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Creates a Stripe Checkout Session for:
    1. Citizen paying a lawyer (Quote) using lawyer's own Stripe keys
    2. Lawyer paying the 20% commission (Platform Fee) using admin's keys
    """
    try:
        quote_id = request.data.get('quote_id')
        payment_type = request.data.get('type')  # 'quote_payment' or 'commission_payment'
        amount = int(request.data.get('amount'))  # Amount in cents

        # Determine Stripe key and redirect URL based on payment type
        stripe_key = settings.STRIPE_API_KEY

        if payment_type == 'quote_payment':
            # Citizen paying → use lawyer's personal Stripe key
            success_url = request.build_absolute_uri(f'/dashboard?payment=success&quote_id={quote_id}')
            cancel_url = request.build_absolute_uri(f'/dashboard?payment=cancel&quote_id={quote_id}')

            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT p.stripe_secret_key FROM quotes_just q "
                    "JOIN profiles_just p ON q.lawyer_id = p.id WHERE q.id = %s",
                    [quote_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    stripe_key = row[0].strip()
        else:
            # Lawyer paying commission → use admin's Stripe key (default)
            success_url = request.build_absolute_uri(f'/dashboard-lawyer?payment=success&quote_id={quote_id}')
            cancel_url = request.build_absolute_uri(f'/dashboard-lawyer?payment=cancel&quote_id={quote_id}')

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'mad',
                    'product_data': {
                        'name': f"Paiement Devis #{quote_id}" if payment_type == 'quote_payment' else "Commission Plateforme (20%)",
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
            },
            api_key=stripe_key
        )
        return Response({'url': session.url})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
