from django.contrib import admin
from .models import StaffProfile, LoginLog, UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'is_approved', 'phone', 'created_at')
    list_filter = ('user_type', 'is_approved', 'is_blacklisted')
    search_fields = ('user__username', 'phone', 'company_name', 'cin')

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'is_active', 'last_activity')
    list_filter = ('role', 'is_active')
    search_fields = ('user__username', 'user__email', 'phone', 'department')

@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'ip_address', 'success')
    list_filter = ('success',)
    search_fields = ('user__username', 'ip_address', 'user_agent')
