"""
JaaS (Jitsi as a Service) JWT token generation endpoint.

POST /api/classrooms/jitsi-token/
  Body: { "room_id": "<uuid>", "is_host": true/false,
          "display_name": "...", "email": "..." }
  Auth: Bearer <supabase_access_token>
  Returns: { "token": "...", "room_name": "vpaas-.../<name>", "domain": "8x8.vc" }

The generated JWT is signed with the JaaS RSA private key and expires in 2 hours.
Participants sharing the same room_id will receive the same room_name so they
all land in the same Jitsi conference.
"""

import secrets
from datetime import datetime, timezone, timedelta

import jwt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


def _build_room_name(room_id: str) -> str:
    """
    Derive a stable, human-identifiable room name from the classroom UUID.
    Using a stable name (not random) is intentional: all participants who
    click "join" for the same classroom must land in the same Jitsi room.
    The date suffix ensures stale lobby states can't persist across days.
    """
    date_token = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = room_id.replace("-", "")[:12]
    return f"francejustice{prefix}{date_token}"


def _generate_jaas_token(
    room_name: str,
    display_name: str,
    email: str,
    is_moderator: bool,
) -> str:
    """Sign a JaaS-compatible JWT with RS256."""
    now = datetime.now(timezone.utc)
    payload = {
        "aud": "jitsi",
        "iss": "chat",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=2)).timestamp()),   # 2-hour limit
        "nbf": int((now - timedelta(seconds=10)).timestamp()),
        "sub": settings.JAAS_APP_ID,
        "context": {
            "features": {
                "livestreaming": False,
                "file-upload": False,
                "outbound-call": False,
                "sip-outbound-call": False,
                "transcription": False,
                "recording": False,
            },
            "user": {
                "hidden-from-recorder": False,
                "moderator": bool(is_moderator),
                "name": display_name or "Participant",
                "avatar": "",
                "email": email or "",
            },
        },
        "room": room_name,
    }

    private_key = settings.JAAS_PRIVATE_KEY
    key_id = settings.JAAS_KEY_ID

    token = jwt.encode(
        payload,
        private_key,
        algorithm="RS256",
        headers={"kid": key_id},
    )
    return token


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def jitsi_token(request):
    """
    Generate a signed JaaS JWT for the requesting user.

    The room_name is derived deterministically from room_id so that all
    participants joining the same classroom end up in the same Jitsi room.
    The token expires in 2 hours matching the maximum session length.
    """
    if not settings.JAAS_APP_ID or not settings.JAAS_PRIVATE_KEY:
        return Response(
            {"error": "JaaS not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    room_id = request.data.get("room_id", "")
    is_host = bool(request.data.get("is_host", False))
    display_name = request.data.get("display_name", "").strip()
    email = request.data.get("email", "").strip()

    if not room_id:
        return Response(
            {"error": "room_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    room_name = _build_room_name(room_id)
    full_room_name = f"{settings.JAAS_APP_ID}/{room_name}"

    try:
        token = _generate_jaas_token(
            room_name=room_name,
            display_name=display_name,
            email=email,
            is_moderator=is_host,
        )
    except Exception as exc:
        return Response(
            {"error": f"Token generation failed: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        "token": token,
        "room_name": full_room_name,
        "domain": "8x8.vc",
    })
