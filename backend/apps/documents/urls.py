from django.urls import path
from .views import document_list, document_create, document_detail, document_preview, document_pdf

app_name = 'documents'

urlpatterns = [
    path('', document_list, name='list'),
    path('create/', document_create, name='create'),
    path('<int:pk>/', document_detail, name='detail'),
    path('<int:pk>/preview/', document_preview, name='preview'),
    path('<int:pk>/pdf/', document_pdf, name='pdf'),
]
