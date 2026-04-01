from django.urls import path
from .views import index, admin_inventory, contract_new, rental_requests, process_rental_request, settings_view

urlpatterns = [
    path('', index, name='dashboard-index'),
    path('inventory/', admin_inventory, name='dashboard-inventory'),
    path('contracts/new/', contract_new, name='dashboard-contract-new'),
    path('requests/', rental_requests, name='dashboard-requests'),
    path('requests/<int:pk>/process/', process_rental_request, name='dashboard-request-process'),
    path('settings/', settings_view, name='dashboard-settings'),
]
