from django.contrib import admin
from .models import Category, Item, ItemImage, MaintenanceLog

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'slug', 'order', 'is_active')
    prepopulated_fields = {'slug': ('name_en',)}

class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 1

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'category', 'status', 'condition', 'price_per_unit', 'quantity_available')
    list_filter = ('status', 'condition', 'category')
    search_fields = ('name_en', 'serial_number', 'tags')
    inlines = [ItemImageInline]

@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ('item', 'technician', 'start_date', 'end_date', 'resolved', 'cost')
    list_filter = ('resolved',)
# Register your models here.
