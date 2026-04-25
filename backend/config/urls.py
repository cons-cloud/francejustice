from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('app.accounts.urls')),
    path('api/profiles/', include('app.profiles.urls')),
    path('api/legal/', include('app.legal.urls')),
    path('api/documents/', include('app.documents.urls')),
    path('api/payments/', include('app.payments.urls')),
    path('api/notifications/', include('app.notifications.urls')),
    path('api/ai/', include('app.ai.urls')),
]
