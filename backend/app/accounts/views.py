from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_token(request):
    return Response({"status": "ok", "message": "Token validation endpoint"})
