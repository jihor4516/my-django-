from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

class UserProfile(models.Model):
    USER_TYPES = [
        ('individual',  'Individual'),
        ('company',     'Company'),
        ('association', 'Association'),
        ('government',  'Government Entity'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
    # Individual fields
    cin = models.CharField(max_length=20, blank=True)
    cin_document = models.FileField(upload_to='docs/cin/', blank=True)
    # Company fields
    company_name = models.CharField(max_length=200, blank=True)
    rc_number = models.CharField(max_length=50, blank=True)
    ice_number = models.CharField(max_length=15, blank=True)
    rc_document = models.FileField(upload_to='docs/rc/', blank=True)
    # Association fields
    association_name = models.CharField(max_length=200, blank=True)
    association_license = models.CharField(max_length=50, blank=True)
    license_document = models.FileField(upload_to='docs/assoc/', blank=True)
    # Shared fields
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    is_approved = models.BooleanField(default=False)
    is_blacklisted = models.BooleanField(default=False)
    preferred_lang = models.CharField(max_length=5, default='ar')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.user_type}"

class StaffProfile(models.Model):
    ROLE_SUPER_ADMIN = 'super_admin'
    ROLE_MANAGER = 'manager'
    ROLE_STOREKEEPER = 'storekeeper'
    ROLE_ACCOUNTANT = 'accountant'
    ROLE_CONSULTANT = 'consultant'
    ROLES = [
        (ROLE_SUPER_ADMIN, 'Super Administrateur'),
        (ROLE_MANAGER, 'Gestionnaire'),
        (ROLE_STOREKEEPER, 'Magasinier'),
        (ROLE_ACCOUNTANT, 'Comptable'),
        (ROLE_CONSULTANT, 'Consultant (lecture)'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLES)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    login_count = models.IntegerField(default=0)
    two_factor_enabled = models.BooleanField(default=False)
    theme_preference = models.CharField(max_length=10, default='dark')
    language_preference = models.CharField(max_length=5, default='ar')

    def __str__(self):
        return f'{self.user.username}'

class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField()
    location = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f'{self.user} {self.timestamp}'

class VerificationCode(models.Model):
    PURPOSE_SIGNUP = 'signup'
    PURPOSES = [(PURPOSE_SIGNUP, 'Signup')]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_for_user(cls, user, purpose):
        code = str(uuid.uuid4().int)[0:6]
        obj = cls.objects.create(user=user, code=code, purpose=purpose, expires_at=timezone.now() + timezone.timedelta(minutes=15))
        return obj
