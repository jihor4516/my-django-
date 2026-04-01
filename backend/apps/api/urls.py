from django.urls import path

from . import views

app_name = 'api'

urlpatterns = [
    path('health/', views.health, name='health'),
    path('categories/', views.categories, name='categories'),
    path('items/', views.items, name='items'),
    path('items/<int:pk>/', views.item_detail, name='item-detail'),
    path('auth/me/', views.auth_me, name='auth-me'),
    path('auth/profile/', views.auth_update_profile, name='auth-update-profile'),
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),
    path('auth/signup/', views.auth_signup, name='auth-signup'),
    path('auth/verify/', views.auth_verify, name='auth-verify'),
    path('auth/resend-code/', views.auth_resend_code, name='auth-resend-code'),
    path('notifications/', views.notifications_list, name='notifications-list'),
    path('notifications/<int:pk>/read/', views.notifications_mark_read, name='notifications-mark-read'),
    path('tenant/dashboard/', views.tenant_dashboard, name='tenant-dashboard'),
    path('staff/dashboard/', views.staff_dashboard, name='staff-dashboard'),
    path('staff/notifications/', views.staff_notifications_create, name='staff-notifications-create'),
    path('documents/', views.documents_list, name='documents-list'),
    path('documents/create/', views.documents_create, name='documents-create'),
    path('staff/clients/', views.staff_clients_list, name='staff-clients-list'),
    path('rental-requests/create/', views.rental_requests_create, name='rental-requests-create'),
    path('staff/requests/', views.staff_requests_list, name='staff-requests-list'),
    path('staff/requests/<int:pk>/process/', views.staff_requests_process, name='staff-requests-process'),
    path('staff/categories/', views.staff_categories_create, name='staff-categories-create'),
    path('staff/items/', views.staff_items_list_create, name='staff-items-list-create'),
    path('staff/items/<int:pk>/', views.staff_items_update, name='staff-items-update'),
    path('staff/items/<int:pk>/images/', views.staff_item_image_upload, name='staff-item-image-upload'),
]
