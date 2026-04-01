from datetime import timedelta
from decimal import Decimal

from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.contrib import messages
from django.utils import timezone
from apps.inventory.models import Item
from apps.contracts.models import RentalContract, RentalRequest, ContractItem
from apps.tenants.models import Tenant
from apps.accounts.models import StaffProfile, UserProfile
from apps.accounts.permissions import staff_role_required, get_staff_profile
from .models import SystemSettings


def _normalize_language_code(value):
    lang = (value or 'ar').strip().lower()
    return lang if lang in {'ar', 'fr', 'en'} else 'ar'

def _next_number(model, field_name, prefix):
    sequence = 1
    while True:
        candidate = f"{prefix}{sequence:04d}"
        if not model.objects.filter(**{field_name: candidate}).exists():
            return candidate
        sequence += 1


def _build_tenant_from_user(target_user, created_by):
    existing = Tenant.objects.filter(email__iexact=target_user.email).first()
    if existing:
        return existing

    profile = UserProfile.objects.filter(user=target_user).first()
    base_ref = ''
    tenant_type = Tenant.TYPE_INDIVIDUAL
    organization = ''
    if profile:
        tenant_type = profile.user_type if profile.user_type in dict(Tenant.TYPES) else Tenant.TYPE_INDIVIDUAL
        base_ref = profile.cin or profile.rc_number or profile.association_license or target_user.username
        organization = profile.company_name or profile.association_name
    base_ref = (base_ref or target_user.username).strip()
    cin_or_rc = base_ref
    counter = 1
    while Tenant.objects.filter(cin_or_rc=cin_or_rc).exists():
        counter += 1
        cin_or_rc = f"{base_ref}-{counter}"

    full_name = f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username
    return Tenant.objects.create(
        type=tenant_type,
        full_name=full_name,
        organization=organization,
        cin_or_rc=cin_or_rc,
        address=(profile.address if profile else '') or 'N/A',
        city=(profile.city if profile else '') or 'N/A',
        phone=(profile.phone if profile else '') or 'N/A',
        email=target_user.email or f"{target_user.username}@local.invalid",
        created_by=created_by,
        preferred_language=_normalize_language_code(profile.preferred_lang if profile else 'ar'),
    )


@staff_role_required()
def index(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/staff-dashboard")

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_STOREKEEPER, StaffProfile.ROLE_MANAGER)
def admin_inventory(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/catalogue")

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER)
def contract_new(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/staff-dashboard")


@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def rental_requests(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/staff-dashboard")


@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER)
def process_rental_request(request, pk):
    rental_request = get_object_or_404(RentalRequest.objects.select_related('item', 'user'), pk=pk)
    action = (request.POST.get('action') or '').strip()
    staff_note = (request.POST.get('staff_note') or '').strip()

    if rental_request.status != RentalRequest.STATUS_PENDING:
        messages.warning(request, 'This request has already been processed.')
        return redirect('/staff/requests/')

    rental_request.staff_note = staff_note
    rental_request.reviewed_by = request.user
    rental_request.reviewed_at = timezone.now()

    if action == 'reject':
        rental_request.status = RentalRequest.STATUS_REJECTED
        rental_request.save(update_fields=['status', 'staff_note', 'reviewed_by', 'reviewed_at'])
        messages.success(request, 'Rental request rejected.')
        return redirect('/staff/requests/')

    if action != 'approve':
        messages.error(request, 'Invalid action.')
        return redirect('/staff/requests/')

    item = rental_request.item
    if item.quantity_available < rental_request.qty:
        messages.error(request, 'Not enough quantity available to approve this request.')
        return redirect('/staff/requests/')

    tenant = _build_tenant_from_user(rental_request.user, request.user)
    start_date = rental_request.start_date or timezone.localdate()
    end_date = rental_request.end_date or start_date
    rental_days = max((end_date - start_date).days + 1, 1)
    unit_price = item.price_per_unit
    subtotal = Decimal(rental_request.qty) * unit_price * Decimal(rental_days)
    system_settings = SystemSettings.get_solo()
    tva_rate = system_settings.vat_rate
    tva_amount = (subtotal * tva_rate) / Decimal('100')
    total_amount = subtotal + tva_amount

    year = timezone.localdate().year
    contract_number = _next_number(RentalContract, 'contract_number', f'GTR-{year}-')
    contract = RentalContract.objects.create(
        contract_number=contract_number,
        tenant=tenant,
        start_date=start_date,
        end_date=end_date,
        event_name=rental_request.event_name or 'Theatre Rental Request',
        event_type='theatre',
        venue=rental_request.venue or 'Rabat',
        purpose=rental_request.note or 'Generated from rental request',
        status=RentalContract.STATUS_PENDING,
        subtotal=subtotal,
        tva_rate=tva_rate,
        tva_amount=tva_amount,
        total_amount=total_amount,
        payment_method=RentalContract.PAYMENT_CASH,
        language=_normalize_language_code(system_settings.default_language),
        created_by=request.user,
    )

    ContractItem.objects.create(
        contract=contract,
        item=item,
        quantity=rental_request.qty,
        unit_price=unit_price,
        days=rental_days,
        subtotal=subtotal,
    )

    item.quantity_available = max(item.quantity_available - rental_request.qty, 0)
    item.quantity_rented = item.quantity_rented + rental_request.qty
    if item.quantity_available == 0:
        item.status = Item.STATUS_RENTED
    item.save(update_fields=['quantity_available', 'quantity_rented', 'status'])

    rental_request.status = RentalRequest.STATUS_APPROVED
    rental_request.save(update_fields=['status', 'staff_note', 'reviewed_by', 'reviewed_at'])

    messages.success(request, f'Request approved. Contract {contract.contract_number} created.')
    return redirect('/staff/requests/')


@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER)
def settings_view(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/staff-dashboard")
