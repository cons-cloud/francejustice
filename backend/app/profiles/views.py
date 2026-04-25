from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET', 'PATCH'])
def get_my_profile(request):
    return Response({"status": "ok", "data": {"username": request.user.username}})
