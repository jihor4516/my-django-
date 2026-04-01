from django.db import models
from django.contrib.auth.models import User
from apps.inventory.models import Item

class ExternalDocument(models.Model):
    DOC_TYPES = [
        ('decharge',  'Exit Voucher / Décharge'),
        ('reception', 'Receiving Voucher / Bon de Réception'),
        ('commande',  'Purchase Order / Bon de Commande'),
        ('pv',        'Handover Report / Procès-verbal'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    doc_number = models.CharField(max_length=30, unique=True)
    external_name = models.CharField(max_length=200)
    external_contact = models.CharField(max_length=100)
    purpose = models.TextField()
    items = models.ManyToManyField(Item, through='DocumentItem')
    expected_return = models.DateField(null=True, blank=True)
    actual_return = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='documents/', null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.doc_number} - {self.get_doc_type_display()}"

class DocumentItem(models.Model):
    document = models.ForeignKey(ExternalDocument, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    notes = models.CharField(max_length=300, blank=True)
    returned = models.BooleanField(default=False)
    return_condition = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.item} in {self.document}"
