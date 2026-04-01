from django.db import models
from django.contrib.auth.models import User

class Tenant(models.Model):
    TYPE_INDIVIDUAL = 'individual'
    TYPE_COMPANY = 'company'
    TYPE_ASSOCIATION = 'association'
    TYPE_GOVERNMENT = 'government'
    TYPE_FOREIGN = 'foreign'
    TYPES = [
        (TYPE_INDIVIDUAL, 'شخص طبيعي / Personne physique'),
        (TYPE_COMPANY, 'شركة / Société'),
        (TYPE_ASSOCIATION, 'جمعية / Association'),
        (TYPE_GOVERNMENT, 'هيئة حكومية / Organisme public'),
        (TYPE_FOREIGN, 'جهة أجنبية / Entité étrangère'),
    ]
    RATING_EXCELLENT = 'excellent'
    RATING_GOOD = 'good'
    RATING_AVERAGE = 'average'
    RATING_BAD = 'bad'
    RATING = [
        (RATING_EXCELLENT, '⭐⭐⭐⭐⭐ ممتاز'),
        (RATING_GOOD, '⭐⭐⭐⭐ جيد'),
        (RATING_AVERAGE, '⭐⭐⭐ متوسط'),
        (RATING_BAD, '⭐ سيء'),
    ]
    type = models.CharField(max_length=20, choices=TYPES)
    full_name = models.CharField(max_length=200)
    organization = models.CharField(max_length=200, blank=True)
    cin_or_rc = models.CharField(max_length=50, unique=True)
    ice = models.CharField(max_length=15, blank=True)
    if_number = models.CharField(max_length=20, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    website = models.URLField(blank=True)
    nationality = models.CharField(max_length=100, default='Marocaine')
    id_document = models.FileField(upload_to='tenants/docs/', blank=True)
    photo = models.ImageField(upload_to='tenants/photos/', null=True, blank=True)
    rating = models.CharField(max_length=20, choices=RATING, default=RATING_GOOD)
    is_blacklisted = models.BooleanField(default=False)
    blacklist_reason = models.TextField(blank=True)
    total_contracts = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    preferred_language = models.CharField(max_length=5, default='ar')

    def __str__(self):
        return self.full_name
# Create your models here.
