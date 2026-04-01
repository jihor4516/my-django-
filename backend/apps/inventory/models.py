from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_ber = models.CharField(max_length=100)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=7)
    slug = models.SlugField(unique=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name_en

class Item(models.Model):
    STATUS_AVAILABLE = 'available'
    STATUS_RENTED = 'rented'
    STATUS_MAINTENANCE = 'maintenance'
    STATUS_RESERVED = 'reserved'
    STATUS_RETIRED = 'retired'
    STATUS = [
        (STATUS_AVAILABLE, 'متاح / Disponible'),
        (STATUS_RENTED, 'مؤجَّر / Loué'),
        (STATUS_MAINTENANCE, 'صيانة / Maintenance'),
        (STATUS_RESERVED, 'محجوز / Réservé'),
        (STATUS_RETIRED, 'مسحوب / Retiré'),
    ]
    CONDITION_NEW = 'new'
    CONDITION_EXCELLENT = 'excellent'
    CONDITION_GOOD = 'good'
    CONDITION_FAIR = 'fair'
    CONDITION_DAMAGED = 'damaged'
    CONDITION = [
        (CONDITION_NEW, 'جديد / Neuf'),
        (CONDITION_EXCELLENT, 'ممتاز / Excellent'),
        (CONDITION_GOOD, 'جيد / Bon'),
        (CONDITION_FAIR, 'مقبول / Passable'),
        (CONDITION_DAMAGED, 'تالف / Endommagé'),
    ]
    PERIOD_HOUR = 'hour'
    PERIOD_DAY = 'day'
    PERIOD_WEEK = 'week'
    PERIOD_MONTH = 'month'
    PERIOD_TYPE = [
        (PERIOD_HOUR, 'ساعة / Heure'),
        (PERIOD_DAY, 'يوم / Jour'),
        (PERIOD_WEEK, 'أسبوع / Semaine'),
        (PERIOD_MONTH, 'شهر / Mois'),
    ]
    serial_number = models.CharField(max_length=100, unique=True)
    qr_code = models.ImageField(upload_to='qrcodes/', null=True, blank=True)
    barcode = models.CharField(max_length=50, blank=True)
    name_ar = models.CharField(max_length=200)
    name_fr = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)
    name_ber = models.CharField(max_length=200)
    description_ar = models.TextField(blank=True)
    description_fr = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ber = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS)
    condition = models.CharField(max_length=20, choices=CONDITION)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2)
    price_period = models.CharField(max_length=10, choices=PERIOD_TYPE, default=PERIOD_DAY)
    weekly_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_total = models.IntegerField(default=1)
    quantity_available = models.IntegerField(default=1)
    quantity_rented = models.IntegerField(default=0)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=100, blank=True)
    material = models.CharField(max_length=200, blank=True)
    era_period = models.CharField(max_length=100, blank=True)
    storage_location = models.CharField(max_length=100)
    acquisition_date = models.DateField(null=True, blank=True)
    acquisition_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_rentals = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    tags = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name_en

class ItemImage(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='items/')
    thumbnail = models.ImageField(upload_to='items/thumbs/', null=True, blank=True)
    is_main = models.BooleanField(default=False)
    caption_ar = models.CharField(max_length=200, blank=True)
    caption_fr = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)

class MaintenanceLog(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    description = models.TextField()
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    technician = models.CharField(max_length=200)
    resolved = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
# Create your models here.
