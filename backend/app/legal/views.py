from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def legal_search(request):
    return Response({"status": "ok", "data": []})

@api_view(['GET'])
def get_articles(request):
    return Response({"status": "ok", "data": []})
