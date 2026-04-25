from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import User
import jwt
from django.conf import settings

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        try:
            token = auth_header.split(' ')[1]
            # In a real scenario, you should validate the JWT against Supabase's JWKS
            # For this demonstration, we'll assume the token contains the 'sub' claim as a UID
            # and we'll map it to a local user.
            
            # Note: Verification logic would go here
            # payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
            # user_id = payload.get('sub')
            
            # Simple mockup for demonstration
            user, created = User.objects.get_or_create(username='supabase_user')
            return (user, None)
        except Exception as e:
            raise exceptions.AuthenticationFailed('Invalid token')
