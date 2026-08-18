from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from supabase import create_client, Client
from .permissions import IsSupabaseAdmin

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_admin(request):
    """
    Endpoint for admins to create users via Supabase Admin API.
    Avoids session loss on the frontend.
    """
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('firstName') or request.data.get('first_name', '')
    last_name = request.data.get('lastName') or request.data.get('last_name', '')
    role = request.data.get('role', 'user')
    
    if not email or not password:
        return Response({"status": "error", "message": "Email et mot de passe requis"}, status=400)
    
    try:
        service_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)
        supabase_url = getattr(settings, 'SUPABASE_URL', None)

        if not service_key or not supabase_url or service_key == supabase_url:
             return Response({"status": "error", "message": "SERVICE_ROLE_KEY non configuré"}, status=400)
        
        supabase: Client = create_client(supabase_url, service_key)
             
        # Create user in Auth using Admin API (Service Role Key required)
        try:
            res = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "user_metadata": {
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": role
                },
                "email_confirm": True
            })
            
            if not res or not hasattr(res, 'user') or not res.user:
                return Response({"status": "error", "message": "Échec de création dans Supabase Auth"}, status=400)
                
            user_id = res.user.id
            
            # Upsert profile in profiles_just with is_verified = True
            supabase.table('profiles_just').upsert({
                "id": user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_verified": True
            }).execute()

            # Ensure related profile tables exist depending on role
            if role == 'lawyer':
                supabase.table('lawyers_just').upsert({
                    "id": user_id,
                    "verification_status": "verified"
                }).execute()
            elif role in ['student', 'professor', 'doctorate']:
                supabase.table('academic_profiles_just').upsert({
                    "id": user_id,
                    "role": role,
                    "status": "verified"
                }).execute()
        except Exception as supabase_err:
            return Response({"status": "error", "message": f"Erreur Supabase Admin: {str(supabase_err)}"}, status=400)
        
        return Response({
            "status": "success", 
            "message": f"Compte {role} créé avec succès",
            "user_id": user_id
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({"status": "error", "message": f"Erreur serveur interne: {str(e)}"}, status=400)

@api_view(['DELETE'])
@permission_classes([IsSupabaseAdmin])
def delete_user_admin(request, user_id):
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        if not settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_SERVICE_KEY == settings.SUPABASE_URL:
             return Response({"status": "error", "message": "SERVICE_ROLE_KEY non configuré ou invalide"}, status=400)
        
        # Le trigger ON DELETE CASCADE dans postgres gèrera la suppression de public.profiles si bien configuré,
        # mais par précaution, on efface aussi profil manuellement si possible.
        supabase.table('profiles_just').delete().eq('id', user_id).execute()
        res = supabase.auth.admin.delete_user(user_id)
        
        return Response({"status": "success", "message": "Utilisateur supprimé"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsSupabaseAdmin])
def suspend_user(request, user_id):
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        # Suspend for 100 years
        res = supabase.auth.admin.update_user_by_id(user_id, {"ban_duration": "876000h"})
        supabase.table('profiles_just').update({"is_verified": False}).eq('id', user_id).execute()
        return Response({"status": "success", "message": "Utilisateur suspendu"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsSupabaseAdmin])
def activate_user(request, user_id):
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        # Remove suspension
        res = supabase.auth.admin.update_user_by_id(user_id, {"ban_duration": "none"})
        supabase.table('profiles_just').update({"is_verified": True}).eq('id', user_id).execute()
        return Response({"status": "success", "message": "Utilisateur activé"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

@api_view(['PUT'])
@permission_classes([IsSupabaseAdmin])
def update_user(request, user_id):
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        first_name = request.data.get('firstName') or request.data.get('first_name', '')
        last_name = request.data.get('lastName') or request.data.get('last_name', '')
        role = request.data.get('role')
        
        supabase.auth.admin.update_user_by_id(user_id, {
            "user_metadata": {
                "first_name": first_name,
                "last_name": last_name,
                "role": role
            }
        })
        
        update_data = {
            "first_name": first_name,
            "last_name": last_name,
        }
        if role:
            update_data["role"] = role

        supabase.table('profiles_just').update(update_data).eq('id', user_id).execute()

        if role == 'lawyer':
            supabase.table('lawyers_just').upsert({
                "id": user_id,
                "verification_status": "verified"
            }).execute()
        elif role in ['student', 'professor', 'doctorate']:
            supabase.table('academic_profiles_just').upsert({
                "id": user_id,
                "role": role,
                "status": "verified"
            }).execute()
        
        return Response({"status": "success", "message": "Utilisateur modifié"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

