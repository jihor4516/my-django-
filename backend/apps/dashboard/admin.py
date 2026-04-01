from django.contrib import admin
from .models import SystemSettings


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
	list_display = ('theatre_legal_name', 'default_language', 'vat_rate', 'updated_at')
