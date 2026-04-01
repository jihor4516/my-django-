from django.db import models
from django.contrib.auth.models import User
from apps.tenants.models import Tenant
from apps.inventory.models import Item

class RentalContract(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_OVERDUE = 'overdue'
    STATUS_DISPUTED = 'disputed'
    STATUS = [
        (STATUS_DRAFT, 'مسودة / Brouillon'),
        (STATUS_PENDING, 'في الانتظار / En attente'),
        (STATUS_ACTIVE, 'نشط / Actif'),
        (STATUS_COMPLETED, 'منتهي / Terminé'),
        (STATUS_CANCELLED, 'ملغى / Annulé'),
        (STATUS_OVERDUE, 'متأخر / En retard'),
        (STATUS_DISPUTED, 'متنازع عليه / Contesté'),
    ]
    PAYMENT_CASH = 'cash'
    PAYMENT_CHECK = 'check'
    PAYMENT_TRANSFER = 'transfer'
    PAYMENT_CARD = 'card'
    PAYMENT_METHOD = [
        (PAYMENT_CASH, 'نقداً / Espèces'),
        (PAYMENT_CHECK, 'شيك / Chèque'),
        (PAYMENT_TRANSFER, 'تحويل / Virement'),
        (PAYMENT_CARD, 'بطاقة / Carte'),
    ]
    contract_number = models.CharField(max_length=50, unique=True, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT)
    items = models.ManyToManyField(Item, through='ContractItem')
    start_date = models.DateField()
    end_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)
    event_name = models.CharField(max_length=300)
    event_type = models.CharField(max_length=100)
    venue = models.CharField(max_length=300)
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default=STATUS_DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    tva_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deposit_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deposit_returned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, blank=True)
    check_number = models.CharField(max_length=50, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    tenant_signature = models.ImageField(upload_to='signatures/', null=True, blank=True)
    staff_signature = models.ImageField(upload_to='signatures/', null=True, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    witness_name = models.CharField(max_length=200, blank=True)
    language = models.CharField(max_length=5, default='ar')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name='approved_contracts')
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    version = models.IntegerField(default=1)

class ContractItem(models.Model):
    contract = models.ForeignKey(RentalContract, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    days = models.IntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    returned = models.BooleanField(default=False)
    return_date = models.DateField(null=True, blank=True)
    return_condition = models.CharField(max_length=100, blank=True)
    damage_noted = models.TextField(blank=True)
    damage_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class ContractHistory(models.Model):
    contract = models.ForeignKey(RentalContract, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    old_status = models.CharField(max_length=50, blank=True)
    new_status = models.CharField(max_length=50, blank=True)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

class RentalRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS = [
        (STATUS_PENDING, 'قيد المراجعة / Pending'),
        (STATUS_APPROVED, 'مقبول / Approved'),
        (STATUS_REJECTED, 'مرفوض / Rejected'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField(default=1)
    event_name = models.CharField(max_length=300, blank=True)
    venue = models.CharField(max_length=300, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default=STATUS_PENDING)
    staff_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_rental_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
# Create your models here.
