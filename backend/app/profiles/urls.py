from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.get_my_profile, name='get-my-profile'),
]
