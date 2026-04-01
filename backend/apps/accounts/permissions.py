from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied

from .models import StaffProfile


def get_staff_profile(user):
    if not user.is_authenticated:
        return None
    return StaffProfile.objects.filter(user=user, is_active=True).first()


def user_has_staff_access(user, allowed_roles=None):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True

    profile = get_staff_profile(user)
    if not profile:
        return bool(user.is_staff and not allowed_roles)

    if not allowed_roles:
        return True
    return profile.role in set(allowed_roles)


def staff_role_required(*allowed_roles):
    def decorator(view_func):
        @login_required
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not user_has_staff_access(request.user, allowed_roles or None):
                raise PermissionDenied("You do not have permission to access this page.")
            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator
