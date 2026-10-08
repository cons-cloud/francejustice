from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'service': 'francejustice-backend',
    })

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('health', health_check, name='health-check-noslash'),
    path('api/health/', health_check, name='api-health-check'),
    path('api/health', health_check, name='api-health-check-noslash'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('app.accounts.urls')),
    path('api/profiles/', include('app.profiles.urls')),
    path('api/legal/', include('app.legal.urls')),
    path('api/documents/', include('app.documents.urls')),
    path('api/payments/', include('app.payments.urls')),
    path('api/notifications/', include('app.notifications.urls')),
    path('api/ai/', include('app.ai.urls')),
    path('api/classrooms/', include('app.classrooms.urls')),
]

