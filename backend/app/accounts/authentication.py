from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import User
import jwt
from django.conf import settings


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Validates the Supabase JWT sent in the Authorization header.
    Exposes the real Supabase user UUID via request.supabase_user_id
    so any view can use it for SQL operations (e.g. INSERT notifications).
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()

        try:
            # Decode WITH signature verification using the jwt secret.
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )

            supabase_user_id = payload.get('sub')
            if not supabase_user_id:
                raise exceptions.AuthenticationFailed('JWT missing sub claim')

            # Attach the Supabase UUID to the request for downstream use
            request.supabase_user_id = supabase_user_id

            # Map to a Django User (create on first sight — no password needed)
            user, _ = User.objects.get_or_create(
                username=f"supabase_{supabase_user_id[:8]}"
            )
            return (user, None)

        except exceptions.AuthenticationFailed:
            raise
        except Exception as exc:
            raise exceptions.AuthenticationFailed(f'Invalid token: {exc}')

