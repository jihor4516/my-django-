from django.contrib import admin
from .models import RentalContract, ContractItem, ContractHistory, RentalRequest

class ContractItemInline(admin.TabularInline):
    model = ContractItem
    extra = 1

@admin.register(RentalContract)
class RentalContractAdmin(admin.ModelAdmin):
    list_display = ('contract_number', 'tenant', 'status', 'start_date', 'end_date', 'total_amount')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('contract_number', 'tenant__full_name', 'event_name')
    inlines = [ContractItemInline]

@admin.register(ContractHistory)
class ContractHistoryAdmin(admin.ModelAdmin):
    list_display = ('contract', 'action', 'timestamp', 'user')

@admin.register(RentalRequest)
class RentalRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'qty', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'item__name_en', 'item__name_ar')
