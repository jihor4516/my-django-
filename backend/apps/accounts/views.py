from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .forms import SignUpForm, LoginForm
from django.contrib.auth import authenticate
from django.contrib import messages
from django.core.mail import send_mail
from django.utils import timezone
from .models import VerificationCode
from .models import StaffProfile
from apps.tenants.models import Tenant
from .permissions import user_has_staff_access

def signup_step1_view(request):
    if request.method == 'POST':
        user_type = request.POST.get('user_type')
        if user_type in ['individual', 'company', 'association', 'government']:
            request.session['signup_user_type'] = user_type
            return redirect('accounts:signup_details')
    return redirect(f"{settings.FRONTEND_APP_URL}/signup")

def signup_details_view(request):
    user_type = request.session.get('signup_user_type')
    if not user_type:
        return redirect('accounts:signup_step1')
    
    return redirect(f"{settings.FRONTEND_APP_URL}/signup")

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            if not user.is_active:
                request.session['pending_verify_user_id'] = user.id
                return redirect('accounts:verify')
            login(request, user)
            next_url = request.GET.get('next')
            if not next_url:
                is_staff_user = user.is_staff or StaffProfile.objects.filter(user=user, is_active=True).exists()
                if is_staff_user:
                    next_url = '/staff/'
                else:
                    next_url = '/accounts/tenant-dashboard/'
            return redirect(next_url)
    return redirect(f"{settings.FRONTEND_APP_URL}/login")


def staff_login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            if not user.is_active:
                messages.error(request, 'Your account is inactive.')
                return redirect('accounts:staff-login')
            if not user_has_staff_access(user):
                messages.error(request, 'This portal is only for theatre staff.')
                return redirect('accounts:staff-login')
            login(request, user)
            next_url = request.GET.get('next') or '/staff/'
            return redirect(next_url)
    return redirect(f"{settings.FRONTEND_APP_URL}/login")

def logout_view(request):
    logout(request)
    return redirect('/')

@login_required
def profile_view(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/tenant-dashboard")


@login_required
def tenant_dashboard_view(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/tenant-dashboard")

def verify_view(request):
    user_id = request.session.get('pending_verify_user_id')
    if not user_id:
        return redirect('accounts:login')
    return redirect(f"{settings.FRONTEND_APP_URL}/signup")

def resend_code_view(request):
    user_id = request.session.get('pending_verify_user_id')
    if user_id:
        from django.contrib.auth.models import User
        u = User.objects.get(id=user_id)
        vc = VerificationCode.create_for_user(u, VerificationCode.PURPOSE_SIGNUP)
        send_mail(
            subject='New Activation Code',
            message=f'Welcome {u.username}\nNew code: {vc.code}\nValid for 15 minutes.',
            from_email=None,
            recipient_list=[u.email],
            fail_silently=True,
        )
    return redirect('accounts:verify')
