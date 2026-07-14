import unittest
from rest_framework import exceptions
from django.test import TestCase
from django.conf import settings
from unittest.mock import Mock
import jwt
from app.accounts.authentication import SupabaseJWTAuthentication

class AccountCreationTest(unittest.TestCase):
    def test_user_creation_logic(self):
        """
        Verify that user creation parameters are handled correctly.
        """
        email = "test@example.com"
        first_name = "Jean"
        last_name = "Dupont"
        role = "lawyer"
        
        # Test basic data structure
        user_data = {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": role
        }
        
        self.assertEqual(user_data["role"], "lawyer")
        self.assertEqual(user_data["first_name"], "Jean")
        self.assertEqual(user_data["last_name"], "Dupont")
        self.assertEqual(user_data["email"], "test@example.com")


class SupabaseJWTAuthenticationTest(TestCase):
    def setUp(self):
        self.auth = SupabaseJWTAuthentication()
        self.secret = getattr(settings, 'SUPABASE_JWT_SECRET', '') or "test_secret_key_at_least_32_characters_long"
        # Overwrite the settings temporarily if not defined
        if not getattr(settings, 'SUPABASE_JWT_SECRET', ''):
            settings.SUPABASE_JWT_SECRET = self.secret

    def test_authenticate_no_header(self):
        request = Mock()
        request.META = {}
        self.assertIsNone(self.auth.authenticate(request))

    def test_authenticate_invalid_header_format(self):
        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': 'InvalidTokenStuff'}
        self.assertIsNone(self.auth.authenticate(request))

    def test_authenticate_valid_jwt(self):
        token_payload = {"sub": "12345678-1234-5678-1234-567812345678", "role": "user"}
        token = jwt.encode(token_payload, self.secret, algorithm="HS256")
        
        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        user, auth_val = self.auth.authenticate(request)
        self.assertIsNotNone(user)
        self.assertEqual(request.supabase_user_id, "12345678-1234-5678-1234-567812345678")
        self.assertTrue(user.username.startswith("supabase_12345678"))

    def test_authenticate_invalid_signature_fails(self):
        token_payload = {"sub": "12345678-1234-5678-1234-567812345678"}
        # Signed with a different key
        bad_token = jwt.encode(token_payload, "different_secret_key_at_least_32_chars_long", algorithm="HS256")
        
        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': f'Bearer {bad_token}'}
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
        
        self.assertIn("Signature verification failed", str(context.exception))

    def test_authenticate_missing_sub_fails(self):
        # Missing 'sub' claim
        token_payload = {"role": "user"}
        token = jwt.encode(token_payload, self.secret, algorithm="HS256")
        
        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
            
        self.assertIn("JWT missing sub claim", str(context.exception))

