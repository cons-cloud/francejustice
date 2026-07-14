import stripe
from django.conf import settings
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from app.notifications.service import (
    notify_payment_received,
    notify_commission_received,
)

stripe.api_key = settings.STRIPE_API_KEY


def _fmt_amount(amount_cents: int) -> str:
    """Convert cents to a readable MAD string: 50000 → '500'"""
    return str(amount_cents // 100)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    Handles Stripe Checkout webhook events.

    On checkout.session.completed:
      - Updates quotes_just.status in Supabase (paid / commissioned)
      - Sends a real-time notification to the payer via public.notifications
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response({"error": "Invalid payload"}, status=400)
    except stripe.SignatureVerificationError:
        return Response({"error": "Invalid signature"}, status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        meta = session.get('metadata', {})
        quote_id = meta.get('quote_id')
        payment_type = meta.get('type')
        # Stripe stores amounts in the smallest currency unit (cents)
        amount_total = session.get('amount_total', 0)

        if quote_id:
            with connection.cursor() as cursor:
                if payment_type == 'quote_payment':
                    # Citizen paid the lawyer — mark quote as paid
                    cursor.execute(
                        "UPDATE quotes_just SET status = 'paid' WHERE id = %s",
                        [quote_id],
                    )
                    # Fetch the client_id to notify them
                    cursor.execute(
                        "SELECT client_id FROM quotes_just WHERE id = %s",
                        [quote_id],
                    )
                    row = cursor.fetchone()
                    if row and row[0]:
                        notify_payment_received(
                            user_id=str(row[0]),
                            amount_str=_fmt_amount(amount_total),
                        )

                elif payment_type == 'commission_payment':
                    # Lawyer paid the platform commission
                    cursor.execute(
                        "UPDATE quotes_just SET status = 'commissioned' WHERE id = %s",
                        [quote_id],
                    )
                    # Fetch lawyer_id to notify them
                    cursor.execute(
                        "SELECT lawyer_id FROM quotes_just WHERE id = %s",
                        [quote_id],
                    )
                    row = cursor.fetchone()
                    if row and row[0]:
                        notify_commission_received(
                            user_id=str(row[0]),
                            amount_str=_fmt_amount(amount_total),
                        )

    return Response({"status": "ok"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Creates a Stripe Checkout Session for:
    1. Citizen paying a lawyer (Quote) using lawyer's own Stripe keys
    2. Lawyer paying the 20% platform commission using admin's keys

    SECURITY: The amount is ALWAYS read from the database (quotes_just),
    never from the client-provided request body. This prevents price
    parameter tampering (an attacker sending amount=1 to pay less).
    """
    try:
        quote_id = request.data.get('quote_id')
        payment_type = request.data.get('type')   # 'quote_payment' or 'commission_payment'

        if not quote_id or not payment_type:
            return Response({'error': 'quote_id and type are required.'}, status=400)

        if payment_type not in ('quote_payment', 'commission_payment'):
            return Response({'error': 'Invalid payment type.'}, status=400)

        stripe_key = settings.STRIPE_API_KEY

        # ── Fetch the authoritative amount + Stripe key from the database ──────
        # The client-provided `amount` is intentionally ignored to prevent
        # price parameter tampering.
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT q.amount, q.commission_amount, q.status, "
                "       p.stripe_secret_key "
                "FROM quotes_just q "
                "JOIN profiles_just p ON q.lawyer_id = p.id "
                "WHERE q.id = %s",
                [quote_id],
            )
            row = cursor.fetchone()

        if not row:
            return Response({'error': 'Devis introuvable.'}, status=404)

        db_amount, db_commission, quote_status, lawyer_stripe_key = row

        # Block payment if the quote is already settled
        if quote_status in ('paid', 'commissioned'):
            return Response({'error': 'Ce devis a déjà été payé.'}, status=400)

        # Pick the correct amount column and Stripe key based on payment type
        if payment_type == 'quote_payment':
            # Convert MAD to centimes (× 100) server-side
            amount_cents = int(db_amount * 100)
            if lawyer_stripe_key:
                stripe_key = lawyer_stripe_key.strip()
            success_url = request.build_absolute_uri(
                f'/dashboard/user?payment=success&quote_id={quote_id}'
            )
            cancel_url = request.build_absolute_uri(
                f'/dashboard/user?payment=cancel&quote_id={quote_id}'
            )
        else:
            # commission_payment — lawyer pays the platform (20%)
            amount_cents = int(db_commission * 100)
            success_url = request.build_absolute_uri(
                f'/dashboard/lawyer?payment=success&quote_id={quote_id}'
            )
            cancel_url = request.build_absolute_uri(
                f'/dashboard/lawyer?payment=cancel&quote_id={quote_id}'
            )

        if amount_cents <= 0:
            return Response({'error': 'Montant invalide (≤ 0).'}, status=400)

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'mad',
                    'product_data': {
                        'name': (
                            f"Paiement Devis #{quote_id}"
                            if payment_type == 'quote_payment'
                            else "Commission Plateforme (20%)"
                        ),
                    },
                    'unit_amount': amount_cents,   # always from DB, never from client
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'quote_id': quote_id,
                'type': payment_type,
            },
            api_key=stripe_key,
        )
        return Response({'url': session.url})

    except Exception as exc:
        return Response({'error': str(exc)}, status=400)
