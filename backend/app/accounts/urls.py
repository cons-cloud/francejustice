from django.urls import path
from . import views, user_views

urlpatterns = [
    path('validate-token/', views.validate_token, name='validate-token'),
    path('create-user-admin/', user_views.create_user_admin, name='create-user-admin'),
    path('delete-user-admin/<str:user_id>/', user_views.delete_user_admin, name='delete-user-admin'),
    path('suspend-user-admin/<str:user_id>/', user_views.suspend_user, name='suspend-user-admin'),
    path('activate-user-admin/<str:user_id>/', user_views.activate_user, name='activate-user-admin'),
    path('update-user-admin/<str:user_id>/', user_views.update_user, name='update-user-admin'),
]
