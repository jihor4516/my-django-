from django.urls import path
from .views import signup_step1_view, signup_details_view, login_view, staff_login_view, logout_view, profile_view, verify_view, resend_code_view, tenant_dashboard_view

app_name = 'accounts'

urlpatterns = [
    path('signup/', signup_step1_view, name='signup_step1'),
    path('signup/details/', signup_details_view, name='signup_details'),
    path('login/', login_view, name='login'),
    path('staff-login/', staff_login_view, name='staff-login'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('verify/', verify_view, name='verify'),
    path('verify/resend/', resend_code_view, name='resend'),
    path('tenant-dashboard/', tenant_dashboard_view, name='tenant-dashboard'),
]
