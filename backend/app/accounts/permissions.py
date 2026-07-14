from rest_framework import permissions
from django.db import connection

class IsSupabaseAdmin(permissions.BasePermission):
    """
    Custom permission to only allow administrative users.
    Checks either standard Django admin flags or the Supabase role in the postgres profiles_just table.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Support standard Django admin
        if request.user.is_staff or request.user.is_superuser:
            return True
            
        supabase_user_id = getattr(request, 'supabase_user_id', None)
        if not supabase_user_id:
            return False
            
        with connection.cursor() as cursor:
            cursor.execute("SELECT role FROM profiles_just WHERE id = %s", [supabase_user_id])
            row = cursor.fetchone()
            return bool(row and row[0] == 'admin')
