from django.urls import path
from django.conf import settings
from django.views.generic import RedirectView
from .views import catalogue, item_detail

app_name = 'inventory'

urlpatterns = [
    path('catalogue/', catalogue, name='catalogue'),
    path('item/<int:pk>/', item_detail, name='item-detail'),
    path('contact/', RedirectView.as_view(url=f'{settings.FRONTEND_APP_URL}/contact', permanent=False), name='contact'),
]
