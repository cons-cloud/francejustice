"""
Notification service — insère des notifications dans Supabase via SQL direct.

Usage dans n'importe quelle view Django :
    from app.notifications.service import notify

    notify(
        user_id='<supabase-uuid>',
        notif_type='payment',
        title='Paiement confirmé',
        message='Votre paiement de 500 MAD a été reçu.',
        link='/dashboard/user',   # optionnel
    )
"""
import logging
from django.db import connection

logger = logging.getLogger(__name__)

VALID_TYPES = {'quote', 'appointment', 'payment', 'message', 'live', 'system'}


def notify(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: str | None = None,
) -> bool:
    """
    Insert a notification row directly into public.notifications.

    Returns True on success, False if the insert failed (never raises, so it
    never breaks the calling view).
    """
    if notif_type not in VALID_TYPES:
        logger.warning("notify(): unknown type '%s', defaulting to 'system'", notif_type)
        notif_type = 'system'

    if not user_id:
        logger.warning("notify(): called with empty user_id, skipping")
        return False

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO public.notifications
                    (user_id, type, title, message, link)
                VALUES
                    (%s::uuid, %s, %s, %s, %s)
                """,
                [user_id, notif_type, title, message, link],
            )
        return True
    except Exception as exc:
        logger.error("notify(): failed to insert notification: %s", exc)
        return False


# ── Helpers sémantiques ─────────────────────────────────────────────────────

def notify_new_quote(user_id: str, lawyer_name: str, quote_ref: str) -> bool:
    """Notify the citizen that a lawyer has sent a quote."""
    return notify(
        user_id=user_id,
        notif_type='quote',
        title='Nouveau devis reçu',
        message=f"Maître {lawyer_name} a répondu à votre demande avec le devis #{quote_ref}.",
        link='/dashboard/user',
    )


def notify_quote_accepted(user_id: str, client_name: str, quote_ref: str) -> bool:
    """Notify the lawyer that the citizen accepted the quote."""
    return notify(
        user_id=user_id,
        notif_type='quote',
        title='Devis accepté',
        message=f"{client_name} a accepté votre devis #{quote_ref}. En attente de paiement.",
        link='/dashboard/lawyer',
    )


def notify_appointment_confirmed(user_id: str, other_name: str, date_str: str) -> bool:
    """Notify a participant that the appointment was confirmed."""
    return notify(
        user_id=user_id,
        notif_type='appointment',
        title='Rendez-vous confirmé',
        message=f"Votre rendez-vous avec {other_name} le {date_str} est confirmé.",
        link='/dashboard/user',
    )


def notify_appointment_cancelled(user_id: str, other_name: str) -> bool:
    """Notify that the appointment was cancelled."""
    return notify(
        user_id=user_id,
        notif_type='appointment',
        title='Rendez-vous annulé',
        message=f"Votre rendez-vous avec {other_name} a été annulé.",
    )


def notify_payment_received(user_id: str, amount_str: str) -> bool:
    """Notify a user that their payment was confirmed."""
    return notify(
        user_id=user_id,
        notif_type='payment',
        title='Paiement confirmé ✓',
        message=f"Votre paiement de {amount_str} MAD a bien été traité.",
        link='/dashboard/user',
    )


def notify_commission_received(user_id: str, amount_str: str) -> bool:
    """Notify a lawyer that their commission payment was confirmed."""
    return notify(
        user_id=user_id,
        notif_type='payment',
        title='Commission réglée ✓',
        message=f"Votre commission de {amount_str} MAD a été reçue par la plateforme.",
        link='/dashboard/lawyer',
    )


def notify_new_message(user_id: str, sender_name: str) -> bool:
    """Notify a user of a new chat message."""
    return notify(
        user_id=user_id,
        notif_type='message',
        title='Nouveau message',
        message=f"{sender_name} vous a envoyé un message.",
    )


def notify_live_started(user_id: str, session_title: str) -> bool:
    """Notify a user that a live session has started."""
    return notify(
        user_id=user_id,
        notif_type='live',
        title='Session live démarrée 🔴',
        message=f'La session "{session_title}" vient de commencer. Rejoignez-la maintenant !',
        link='/classrooms',
    )
