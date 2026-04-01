@echo off
rem Rename this file to email-settings.bat and replace the values below.
rem If you leave this file disabled, verification codes will not be sent by email.

set DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
set DJANGO_EMAIL_HOST=smtp.gmail.com
set DJANGO_EMAIL_PORT=587
set DJANGO_EMAIL_HOST_USER=your-email@gmail.com
set DJANGO_EMAIL_HOST_PASSWORD=your-app-password
set DJANGO_EMAIL_USE_TLS=true
set DJANGO_EMAIL_USE_SSL=false
set DJANGO_DEFAULT_FROM_EMAIL=your-email@gmail.com