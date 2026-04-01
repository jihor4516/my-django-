from .models import SystemSettings


def system_settings(request):
    return {
        'system_settings': SystemSettings.get_solo(),
    }
