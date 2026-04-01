from django.urls import path
from .views import contract_pdf_view, contract_preview_view, return_document_pdf_view, return_document_preview_view, create_rental_request, verify_view

app_name = 'contracts'

urlpatterns = [
    path('contract/<int:pk>/preview/', contract_preview_view, name='contract-preview'),
    path('contract/<int:pk>/pdf/', contract_pdf_view, name='contract-pdf'),
    path('return/<int:pk>/pdf/', return_document_pdf_view, name='return-document-pdf'),
    path('return/<int:pk>/preview/', return_document_preview_view, name='return-document-preview'),
    path('request/<int:item_id>/', create_rental_request, name='rental-request'),
    path('verify/', verify_view, name='verify'),
]
