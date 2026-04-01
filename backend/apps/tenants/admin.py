from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'type', 'city', 'rating', 'is_blacklisted')
    list_filter = ('type', 'city', 'rating', 'is_blacklisted')
    search_fields = ('full_name', 'cin_or_rc', 'email', 'phone')
# Register your models here.
