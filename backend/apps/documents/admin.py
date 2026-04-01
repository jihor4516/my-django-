from django.contrib import admin
from .models import ExternalDocument, DocumentItem

class DocumentItemInline(admin.TabularInline):
    model = DocumentItem
    extra = 1

@admin.register(ExternalDocument)
class ExternalDocumentAdmin(admin.ModelAdmin):
    list_display = ('doc_number', 'doc_type', 'external_name', 'status', 'created_at')
    list_filter = ('doc_type', 'status')
    search_fields = ('doc_number', 'external_name')
    inlines = [DocumentItemInline]
