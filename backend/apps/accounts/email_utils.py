from django.conf import settings
from django.core.mail import send_mail


NON_DELIVERY_BACKENDS = {
    'django.core.mail.backends.console.EmailBackend',
    'django.core.mail.backends.filebased.EmailBackend',
    'django.core.mail.backends.locmem.EmailBackend',
    'django.core.mail.backends.dummy.EmailBackend',
}


def email_delivery_configured():
    backend = (getattr(settings, 'EMAIL_BACKEND', '') or '').strip()
    if not backend or backend in NON_DELIVERY_BACKENDS:
        return False
    if backend == 'django.core.mail.backends.smtp.EmailBackend' and not getattr(settings, 'EMAIL_HOST', ''):
        return False
    return True


def send_signup_verification_email(user, code, *, is_resend=False):
    subject = 'New Activation Code / رمز تفعيل جديد' if is_resend else 'Activate your account / تفعيل حسابك'
    intro = 'New activation code:' if is_resend else 'Activation code:'
    message = (
        f'Welcome {user.username}\n'
        f'{intro} {code}\n'
        'Valid for 15 minutes.\n\n'
        'مرحبا بك\n'
        f'رمز التفعيل: {code}\n'
        'صالح لمدة 15 دقيقة.'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )