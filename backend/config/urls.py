"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import include
from django.views.generic import RedirectView
from django.conf.urls.i18n import i18n_patterns
from django.conf import settings
from django.conf.urls.static import static
from apps.accounts.views import staff_login_view

urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),
    path('api/', include('apps.api.urls')),
]

urlpatterns += i18n_patterns(
    path('gtr-admin/', admin.site.urls),
    path('staff/login/', staff_login_view, name='staff-login-direct'),
    path('', RedirectView.as_view(url=settings.FRONTEND_APP_URL, permanent=False), name='public-home'),
    path('dashboard/', include('apps.dashboard.urls')),
    path('staff/', include('apps.dashboard.urls')),
    path('contracts/', include('apps.contracts.urls')),
    path('documents/', include('apps.documents.urls')),
    path('accounts/', include('apps.accounts.urls')),
    path('', include('apps.inventory.urls')),
    prefix_default_language=False,
)

if settings.DEBUG:
    urlpatterns += [
        path('rosetta/', include('rosetta.urls')),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
