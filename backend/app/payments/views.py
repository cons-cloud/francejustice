from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    return Response({"status": "ok", "message": "Webhook received"})

@api_view(['POST'])
def create_checkout(request):
    return Response({"status": "ok", "url": "https://checkout.stripe.com/..."})
