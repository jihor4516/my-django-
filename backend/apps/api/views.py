import json
import os
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.conf import settings
from django.db import transaction
from django.urls import reverse
from django.core.paginator import Paginator
from django.http import FileResponse, Http404, JsonResponse
from django.db.models import Max, Q
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from apps.accounts.forms import SignUpForm
from apps.accounts.email_utils import email_delivery_configured, send_signup_verification_email
from apps.accounts.models import StaffProfile, UserProfile, VerificationCode
from apps.accounts.permissions import get_staff_profile, user_has_staff_access
from apps.contracts.models import RentalContract, RentalRequest
from apps.contracts.models import ContractItem
from apps.dashboard.models import SystemSettings
from apps.documents.models import DocumentItem, ExternalDocument
from apps.inventory.models import Category, Item, ItemImage
from apps.notifications.models import Notification
from apps.tenants.models import Tenant


LANG_FIELDS = {'ar', 'fr', 'en'}


def _normalize_language_code(value):
    lang = (value or 'ar').strip().lower()
    return lang if lang in LANG_FIELDS else 'ar'


def _image_field_url(image_field):
    if not image_field:
        return None
    try:
        return image_field.url
    except ValueError:
        return None


def _json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _lang(request):
    return _normalize_language_code(request.GET.get('lang'))


def _category_payload(category, lang):
    return {
        'id': category.id,
        'slug': category.slug,
        'name': getattr(category, f'name_{lang}', category.name_ar),
        'icon': category.icon or 'package',
        'color': category.color,
    }


def _item_payload(item, lang):
    main_image_obj = item.images.filter(is_main=True).first() or item.images.first()
    return {
        'id': item.id,
        'serial_number': item.serial_number,
        'name': getattr(item, f'name_{lang}', item.name_ar),
        'name_ar': item.name_ar,
        'name_fr': item.name_fr,
        'name_en': item.name_en,
        'description': getattr(item, f'description_{lang}', item.description_ar),
        'description_ar': item.description_ar,
        'description_fr': item.description_fr,
        'description_en': item.description_en,
        'category': _category_payload(item.category, lang),
        'category_id': item.category_id,
        'status': item.status,
        'condition': item.condition,
        'quantity_available': item.quantity_available,
        'quantity_total': item.quantity_total,
        'storage_location': item.storage_location,
        'is_featured': item.is_featured,
        'images_count': item.images.count(),
        'main_image': _image_field_url(main_image_obj.image) if main_image_obj else None,
    }


def _user_payload(user):
    profile = UserProfile.objects.filter(user=user).first()
    staff_profile = get_staff_profile(user)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_authenticated': True,
        'is_staff_user': bool(user_has_staff_access(user)),
        'profile': {
            'user_type': profile.user_type if profile else '',
            'phone': profile.phone if profile else '',
            'address': profile.address if profile else '',
            'city': profile.city if profile else '',
            'preferred_lang': _normalize_language_code(profile.preferred_lang if profile else 'ar'),
        },
        'staff_profile': {
            'role': staff_profile.role,
            'department': staff_profile.department,
        } if staff_profile else None,
    }


def _contract_payload(contract):
    return {
        'id': contract.id,
        'contract_number': contract.contract_number,
        'status': contract.status,
        'event_name': contract.event_name,
        'venue': contract.venue,
        'start_date': contract.start_date,
        'end_date': contract.end_date,
        'total_amount': str(contract.total_amount),
        'contract_pdf_url': f'/contracts/contract/{contract.id}/pdf/',
        'contract_preview_url': f'/contracts/contract/{contract.id}/preview/',
    }


def _notification_payload(notification):
    return {
        'id': notification.id,
        'title': notification.title,
        'message': notification.message,
        'action_url': notification.action_url,
        'is_read': notification.is_read,
        'created_at': notification.created_at,
        'sender': notification.sender.get_full_name() or notification.sender.username if notification.sender else '',
    }


def _request_payload(rental_request, lang='ar'):
    return {
        'id': rental_request.id,
        'user': {
            'id': rental_request.user_id,
            'username': rental_request.user.username,
            'full_name': f'{rental_request.user.first_name} {rental_request.user.last_name}'.strip(),
            'email': rental_request.user.email,
        },
        'item': {
            'id': rental_request.item.id,
            'name': getattr(rental_request.item, f'name_{lang}', rental_request.item.name_ar),
        },
        'qty': rental_request.qty,
        'event_name': rental_request.event_name,
        'venue': rental_request.venue,
        'note': rental_request.note,
        'start_date': rental_request.start_date,
        'end_date': rental_request.end_date,
        'status': rental_request.status,
        'staff_note': rental_request.staff_note,
        'created_at': rental_request.created_at,
    }


def _document_payload(document, lang='ar'):
    return {
        'id': document.id,
        'doc_number': document.doc_number,
        'doc_type': document.doc_type,
        'doc_type_label': document.get_doc_type_display(),
        'external_name': document.external_name,
        'external_contact': document.external_contact,
        'purpose': document.purpose,
        'status': document.status,
        'created_at': document.created_at,
        'document_preview_url': reverse('documents:preview', args=[document.id]),
        'document_pdf_url': reverse('documents:pdf', args=[document.id]),
        'items': [
            {
                'id': doc_item.id,
                'item_id': doc_item.item_id,
                'item_name': getattr(doc_item.item, f'name_{lang}', doc_item.item.name_ar),
                'quantity': doc_item.quantity,
                'notes': doc_item.notes,
            }
            for doc_item in document.documentitem_set.select_related('item').all()
        ],
    }


def _client_payload(user):
    profile = UserProfile.objects.filter(user=user).first()
    full_name = f'{user.first_name} {user.last_name}'.strip() or user.username
    phone = ''
    address = ''
    city = ''
    if profile:
        phone = profile.phone or profile.phone2 or ''
        address = profile.address or ''
        city = profile.city or ''
    return {
        'id': user.id,
        'username': user.username,
        'full_name': full_name,
        'email': user.email,
        'phone': phone,
        'address': address,
        'city': city,
    }


def _tenant_profile_payload(tenant):
    return {
        'id': tenant.id,
        'type': tenant.type,
        'full_name': tenant.full_name,
        'organization': tenant.organization,
        'cin_or_rc': tenant.cin_or_rc,
        'ice': tenant.ice,
        'address': tenant.address,
        'city': tenant.city,
        'phone': tenant.phone,
        'phone2': tenant.phone2,
        'email': tenant.email,
        'website': tenant.website,
        'preferred_language': tenant.preferred_language,
        'total_contracts': tenant.total_contracts,
        'total_spent': str(tenant.total_spent),
        'photo_url': _image_field_url(tenant.photo),
        'id_document_url': _image_field_url(tenant.id_document),
        'created_at': tenant.created_at,
    }


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_decimal(value, default='0'):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


def _next_number(model, field_name, prefix):
    sequence = 1
    while True:
        candidate = f'{prefix}{sequence:04d}'
        if not model.objects.filter(**{field_name: candidate}).exists():
            return candidate
        sequence += 1


def _unique_category_slug(*values):
    base_value = next((value for value in values if value and str(value).strip()), 'category')
    base_slug = slugify(base_value) or 'category'
    candidate = base_slug
    sequence = 2
    while Category.objects.filter(slug=candidate).exists():
        candidate = f'{base_slug}-{sequence}'
        sequence += 1
    return candidate


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
        cin_or_rc = f'{base_ref}-{counter}'

    full_name = f'{target_user.first_name} {target_user.last_name}'.strip() or target_user.username
    return Tenant.objects.create(
        type=tenant_type,
        full_name=full_name,
        organization=organization,
        cin_or_rc=cin_or_rc,
        address=(profile.address if profile else '') or 'N/A',
        city=(profile.city if profile else '') or 'N/A',
        phone=(profile.phone if profile else '') or 'N/A',
        email=target_user.email or f'{target_user.username}@local.invalid',
        created_by=created_by,
        preferred_language=_normalize_language_code(profile.preferred_lang if profile else 'ar'),
    )


@require_GET
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'grand-theatre-api'})


@require_GET
def categories(request):
    lang = _lang(request)
    queryset = Category.objects.filter(is_active=True).order_by('order')
    data = []
    for category in queryset:
        payload = _category_payload(category, lang)
        payload['items_count'] = Item.objects.filter(is_active=True, category=category).count()
        data.append(payload)
    return JsonResponse({'results': data})


@require_GET
def items(request):
    lang = _lang(request)
    q = (request.GET.get('q') or '').strip()
    cat = (request.GET.get('cat') or '').strip()
    status = (request.GET.get('status') or '').strip()
    page = int(request.GET.get('page') or 1)

    queryset = Item.objects.filter(is_active=True).select_related('category').order_by('-updated_at')
    if q:
        queryset = queryset.filter(
            Q(name_ar__icontains=q)
            | Q(name_fr__icontains=q)
            | Q(name_en__icontains=q)
            | Q(description_ar__icontains=q)
            | Q(description_fr__icontains=q)
            | Q(description_en__icontains=q)
        )
    if cat:
        queryset = queryset.filter(category__slug=cat)
    if status in {Item.STATUS_AVAILABLE, Item.STATUS_RENTED, Item.STATUS_MAINTENANCE, Item.STATUS_RESERVED, Item.STATUS_RETIRED}:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, 12)
    page_obj = paginator.get_page(page)
    return JsonResponse(
        {
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'page': page_obj.number,
            'results': [_item_payload(item, lang) for item in page_obj.object_list],
        }
    )


@require_GET
def item_detail(request, pk):
    lang = _lang(request)
    try:
        item = Item.objects.select_related('category').get(pk=pk, is_active=True)
    except Item.DoesNotExist:
        return JsonResponse({'detail': 'Not found.'}, status=404)

    data = _item_payload(item, lang)
    data['images'] = [request.build_absolute_uri(img.image.url) for img in item.images.all() if img.image]
    return JsonResponse(data)


@require_GET
def auth_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'is_authenticated': False, 'user': None}, status=401)
    unread_notifications = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return JsonResponse({'is_authenticated': True, 'user': _user_payload(request.user), 'unread_notifications': unread_notifications})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def auth_update_profile(request):
    payload = _json_body(request)
    current_password = payload.get('current_password') or ''
    first_name = (payload.get('first_name') or '').strip()
    last_name = (payload.get('last_name') or '').strip()
    email = (payload.get('email') or '').strip().lower()
    phone = (payload.get('phone') or '').strip()
    city = (payload.get('city') or '').strip()
    address = (payload.get('address') or '').strip()
    preferred_lang = _normalize_language_code(payload.get('preferred_lang'))

    if not current_password:
        return JsonResponse({'detail': 'Current password is required.'}, status=400)

    if not authenticate(request, username=request.user.username, password=current_password):
        return JsonResponse({'detail': 'Current password is incorrect.'}, status=400)

    if not first_name or not last_name:
        return JsonResponse({'detail': 'First name and last name are required.'}, status=400)

    if not email:
        return JsonResponse({'detail': 'Email is required.'}, status=400)

    if User.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
        return JsonResponse({'detail': 'This email is already in use.'}, status=400)

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={
            'user_type': 'individual',
            'phone': '',
            'address': '',
            'city': '',
            'preferred_lang': preferred_lang,
        },
    )

    request.user.first_name = first_name
    request.user.last_name = last_name
    request.user.email = email
    request.user.save(update_fields=['first_name', 'last_name', 'email'])

    profile.phone = phone
    profile.city = city
    profile.address = address
    profile.preferred_lang = preferred_lang
    profile.save(update_fields=['phone', 'city', 'address', 'preferred_lang'])

    return JsonResponse({'detail': 'Account updated successfully.', 'user': _user_payload(request.user)})


@csrf_exempt
@require_http_methods(['POST'])
def auth_login(request):
    payload = _json_body(request)
    username = (payload.get('username') or '').strip()
    password = payload.get('password') or ''
    login_username = username
    if '@' in username:
        matched_user = User.objects.filter(email__iexact=username).only('username').first()
        if matched_user:
            login_username = matched_user.username

    user = authenticate(request, username=login_username, password=password)
    if not user:
        return JsonResponse({'detail': 'Invalid credentials.'}, status=400)
    if not user.is_active:
        request.session['pending_verify_user_id'] = user.id
        return JsonResponse({'detail': 'Account inactive. Verification required.', 'requires_verification': True}, status=403)
    login(request, user)
    return JsonResponse({'detail': 'Logged in successfully.', 'user': _user_payload(user)})


@csrf_exempt
@require_http_methods(['POST'])
def auth_logout(request):
    logout(request)
    return JsonResponse({'detail': 'Logged out successfully.'})


@csrf_exempt
@require_http_methods(['POST'])
def auth_signup(request):
    payload = _json_body(request)
    form = SignUpForm(payload)
    if not form.is_valid():
        return JsonResponse({'detail': 'Invalid signup data.', 'errors': form.errors}, status=400)

    email_ready = email_delivery_configured()
    with transaction.atomic():
        user = form.save(commit=True)
        user.is_active = False
        user.save(update_fields=['is_active'])
        verification = VerificationCode.create_for_user(user, VerificationCode.PURPOSE_SIGNUP)
        if email_ready:
            send_signup_verification_email(user, verification.code)

    request.session['pending_verify_user_id'] = user.id
    response_payload = {
        'detail': 'Account created. Verification code sent.' if email_ready else 'Account created. Email delivery is not configured in this environment.',
        'requires_verification': True,
        'email_delivery_configured': email_ready,
    }
    if settings.DEBUG and not email_ready:
        response_payload['verification_code'] = verification.code
    return JsonResponse(response_payload)


@csrf_exempt
@require_http_methods(['POST'])
def auth_verify(request):
    payload = _json_body(request)
    code = (payload.get('code') or '').strip()
    user_id = request.session.get('pending_verify_user_id')
    if not user_id:
        return JsonResponse({'detail': 'No pending verification session.'}, status=400)

    verification = VerificationCode.objects.filter(
        user_id=user_id,
        code=code,
        is_used=False,
        purpose=VerificationCode.PURPOSE_SIGNUP,
        expires_at__gt=timezone.now(),
    ).first()
    if not verification:
        return JsonResponse({'detail': 'Invalid or expired code.'}, status=400)

    verification.is_used = True
    verification.save(update_fields=['is_used'])
    user = User.objects.get(pk=user_id)
    user.is_active = True
    user.save(update_fields=['is_active'])
    login(request, user)
    request.session.pop('pending_verify_user_id', None)
    return JsonResponse({'detail': 'Account verified.', 'user': _user_payload(user)})


@csrf_exempt
@require_http_methods(['POST'])
def auth_resend_code(request):
    user_id = request.session.get('pending_verify_user_id')
    if not user_id:
        return JsonResponse({'detail': 'No pending verification session.'}, status=400)
    user = User.objects.get(pk=user_id)
    email_ready = email_delivery_configured()
    with transaction.atomic():
        verification = VerificationCode.create_for_user(user, VerificationCode.PURPOSE_SIGNUP)
        if email_ready:
            send_signup_verification_email(user, verification.code, is_resend=True)
    response_payload = {
        'detail': 'Verification code resent.' if email_ready else 'A new verification code was generated, but email delivery is not configured in this environment.',
        'email_delivery_configured': email_ready,
    }
    if settings.DEBUG and not email_ready:
        response_payload['verification_code'] = verification.code
    return JsonResponse(response_payload)


@require_GET
@login_required
def tenant_dashboard(request):
    lang = _lang(request)
    user_email = request.user.email
    requests_qs = RentalRequest.objects.select_related('item').filter(user=request.user).order_by('-created_at')
    contracts_qs = RentalContract.objects.select_related('tenant').filter(
        Q(tenant__email__iexact=user_email) | Q(tenant__created_by=request.user)
    ).order_by('-created_at')
    tenant_profiles = Tenant.objects.filter(
        Q(email__iexact=user_email) | Q(created_by=request.user)
    ).order_by('-created_at')
    notifications_qs = Notification.objects.filter(recipient=request.user).select_related('sender').order_by('-created_at')

    latest_contracts = []
    for contract in contracts_qs[:10]:
        payload = _contract_payload(contract)
        has_return_data = bool(contract.actual_return_date or contract.status == RentalContract.STATUS_COMPLETED or contract.contractitem_set.filter(returned=True).exists())
        payload['return_pdf_url'] = f'/contracts/return/{contract.id}/pdf/' if has_return_data else None
        payload['return_preview_url'] = f'/contracts/return/{contract.id}/preview/' if has_return_data else None
        latest_contracts.append(payload)

    return JsonResponse(
        {
            'counts': {
                'requests': requests_qs.count(),
                'contracts': contracts_qs.count(),
                'tenants': tenant_profiles.count(),
                'notifications': notifications_qs.filter(is_read=False).count(),
            },
            'latest_requests': [_request_payload(obj, lang) for obj in requests_qs[:10]],
            'latest_contracts': latest_contracts,
            'tenant_profiles': [_tenant_profile_payload(obj) for obj in tenant_profiles[:10]],
            'notifications': [_notification_payload(obj) for obj in notifications_qs[:10]],
        }
    )


@require_GET
@login_required
def staff_dashboard(request):
    if not user_has_staff_access(request.user):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    recent_contracts = RentalContract.objects.select_related('tenant').order_by('-created_at')[:8]
    recent_contract_payloads = []
    for contract in recent_contracts:
        payload = _contract_payload(contract)
        has_return_data = bool(contract.actual_return_date or contract.status == RentalContract.STATUS_COMPLETED or contract.contractitem_set.filter(returned=True).exists())
        payload['return_pdf_url'] = f'/contracts/return/{contract.id}/pdf/' if has_return_data else None
        payload['return_preview_url'] = f'/contracts/return/{contract.id}/preview/' if has_return_data else None
        recent_contract_payloads.append(payload)
    return JsonResponse(
        {
            'counts': {
                'items_total': Item.objects.count(),
                'items_available': Item.objects.filter(status=Item.STATUS_AVAILABLE).count(),
                'tenants_total': Tenant.objects.count(),
                'contracts_total': RentalContract.objects.count(),
                'active_contracts': RentalContract.objects.filter(status=RentalContract.STATUS_ACTIVE).count(),
                'pending_requests': RentalRequest.objects.filter(status=RentalRequest.STATUS_PENDING).count(),
            },
            'recent_contracts': recent_contract_payloads,
            'staff_profile': _user_payload(request.user).get('staff_profile'),
        }
    )


@require_GET
@login_required
def documents_list(request):
    if not user_has_staff_access(request.user):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    lang = _lang(request)
    queryset = ExternalDocument.objects.order_by('-created_at')
    return JsonResponse({'results': [_document_payload(doc, lang) for doc in queryset]})


@require_GET
@login_required
def staff_clients_list(request):
    if not user_has_staff_access(request.user):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    staff_user_ids = StaffProfile.objects.filter(is_active=True).values_list('user_id', flat=True)
    queryset = (
        User.objects.filter(is_active=True)
        .exclude(is_superuser=True)
        .exclude(id__in=staff_user_ids)
        .order_by('first_name', 'last_name', 'username')
    )
    return JsonResponse({'results': [_client_payload(user) for user in queryset[:300]]})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def documents_create(request):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    payload = _json_body(request)
    doc_type = (payload.get('doc_type') or '').strip()
    client_user_id = payload.get('client_user_id')
    external_name = (payload.get('external_name') or '').strip()
    external_contact = (payload.get('external_contact') or '').strip()
    purpose = (payload.get('purpose') or '').strip()
    items = payload.get('items') or []
    if not all([doc_type, purpose]):
        return JsonResponse({'detail': 'Missing required fields.'}, status=400)

    if client_user_id:
        try:
            client_user = User.objects.get(pk=client_user_id, is_active=True)
        except User.DoesNotExist:
            return JsonResponse({'detail': 'Client account not found.'}, status=404)

        if user_has_staff_access(client_user):
            return JsonResponse({'detail': 'Selected account is not a client.'}, status=400)

        client_payload = _client_payload(client_user)
        external_name = client_payload.get('full_name') or external_name
        external_contact = client_payload.get('phone') or client_payload.get('email') or external_contact or client_user.username

    if not all([external_name, external_contact]):
        return JsonResponse({'detail': 'Client data is incomplete.'}, status=400)

    prefix = {'decharge': 'DS', 'reception': 'BR', 'commande': 'BC', 'pv': 'PV'}.get(doc_type, 'DOC')
    year = timezone.now().year
    sequence = ExternalDocument.objects.filter(doc_type=doc_type, created_at__year=year).count() + 1
    doc_number = f'{prefix}-{year}-{sequence:04d}'
    document = ExternalDocument.objects.create(
        doc_type=doc_type,
        doc_number=doc_number,
        external_name=external_name,
        external_contact=external_contact,
        purpose=purpose,
        created_by=request.user,
        status='active',
    )
    for raw_item in items:
        item_id = raw_item.get('item_id')
        quantity = int(raw_item.get('quantity') or 0)
        notes = (raw_item.get('notes') or '').strip()
        if not item_id or quantity <= 0:
            continue
        try:
            item = Item.objects.get(pk=item_id, is_active=True)
        except Item.DoesNotExist:
            continue
        DocumentItem.objects.create(document=document, item=item, quantity=quantity, notes=notes)
    return JsonResponse({'detail': 'Document created.', 'document': _document_payload(document)})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def rental_requests_create(request):
    payload = _json_body(request)
    item_id = payload.get('item_id')
    qty = _to_int(payload.get('qty'), 1)
    event_name = (payload.get('event_name') or '').strip()
    venue = (payload.get('venue') or '').strip()
    start_date = payload.get('start_date')
    end_date = payload.get('end_date')
    note = (payload.get('note') or '').strip()

    if not item_id:
        return JsonResponse({'detail': 'item_id is required.'}, status=400)
    if qty <= 0:
        return JsonResponse({'detail': 'qty must be greater than zero.'}, status=400)

    try:
        item = Item.objects.get(pk=item_id, is_active=True)
    except Item.DoesNotExist:
        return JsonResponse({'detail': 'Item not found.'}, status=404)

    if item.quantity_available < qty:
        return JsonResponse({'detail': 'Requested quantity exceeds available stock.'}, status=400)

    rental_request = RentalRequest.objects.create(
        user=request.user,
        item=item,
        qty=qty,
        event_name=event_name,
        venue=venue,
        start_date=start_date or None,
        end_date=end_date or None,
        note=note,
    )
    return JsonResponse({'detail': 'Rental request submitted.', 'request': _request_payload(rental_request)})


@require_GET
@login_required
def staff_requests_list(request):
    if not user_has_staff_access(request.user):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    status = (request.GET.get('status') or '').strip()
    lang = _lang(request)
    queryset = RentalRequest.objects.select_related('item', 'user').order_by('-created_at')
    if status in {RentalRequest.STATUS_PENDING, RentalRequest.STATUS_APPROVED, RentalRequest.STATUS_REJECTED}:
        queryset = queryset.filter(status=status)

    return JsonResponse({'results': [_request_payload(obj, lang) for obj in queryset[:100]]})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def staff_requests_process(request, pk):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    payload = _json_body(request)
    action = (payload.get('action') or '').strip().lower()
    staff_note = (payload.get('staff_note') or '').strip()

    try:
        rental_request = RentalRequest.objects.select_related('item', 'user').get(pk=pk)
    except RentalRequest.DoesNotExist:
        return JsonResponse({'detail': 'Request not found.'}, status=404)

    if rental_request.status != RentalRequest.STATUS_PENDING:
        return JsonResponse({'detail': 'This request has already been processed.'}, status=400)

    rental_request.staff_note = staff_note
    rental_request.reviewed_by = request.user
    rental_request.reviewed_at = timezone.now()

    if action == 'reject':
        rental_request.status = RentalRequest.STATUS_REJECTED
        rental_request.save(update_fields=['status', 'staff_note', 'reviewed_by', 'reviewed_at'])
        return JsonResponse({'detail': 'Request rejected.', 'request': _request_payload(rental_request)})

    if action != 'approve':
        return JsonResponse({'detail': 'Invalid action. Use approve or reject.'}, status=400)

    item = rental_request.item
    if item.quantity_available < rental_request.qty:
        return JsonResponse({'detail': 'Not enough quantity available.'}, status=400)

    tenant = _build_tenant_from_user(rental_request.user, request.user)
    start_date = rental_request.start_date or timezone.localdate()
    end_date = rental_request.end_date or start_date
    rental_days = max((end_date - start_date).days + 1, 1)
    unit_price = Decimal('0')
    subtotal = Decimal('0')
    system_settings = SystemSettings.get_solo()
    tva_rate = Decimal('0')
    tva_amount = Decimal('0')
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

    Notification.objects.create(
        recipient=rental_request.user,
        sender=request.user,
        title='تمت الموافقة على طلبك',
        message=f'تمت الموافقة على طلب الإيجار الخاص بك، ويمكنك الآن تنزيل العقد رقم {contract.contract_number}.',
        action_url='/account',
    )

    return JsonResponse(
        {
            'detail': 'Request approved and contract generated.',
            'request': _request_payload(rental_request),
            'contract': {
                **_contract_payload(contract),
            },
        }
    )


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@login_required
def staff_items_list_create(request):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    if request.method == 'GET':
        lang = _lang(request)
        queryset = Item.objects.filter(is_active=True).select_related('category').order_by('-updated_at')
        return JsonResponse({'results': [_item_payload(item, lang) for item in queryset[:200]]})

    payload = _json_body(request)
    required_fields = ['serial_number', 'name_ar', 'name_fr', 'name_en', 'category_id', 'status', 'condition', 'storage_location']
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return JsonResponse({'detail': f'Missing required fields: {", ".join(missing)}'}, status=400)

    try:
        category = Category.objects.get(pk=payload['category_id'], is_active=True)
    except Category.DoesNotExist:
        return JsonResponse({'detail': 'Invalid category_id.'}, status=400)

    quantity_total = max(_to_int(payload.get('quantity_total'), 1), 1)
    quantity_available = _to_int(payload.get('quantity_available'), quantity_total)
    quantity_available = min(max(quantity_available, 0), quantity_total)

    item = Item.objects.create(
        serial_number=(payload.get('serial_number') or '').strip(),
        name_ar=(payload.get('name_ar') or '').strip(),
        name_fr=(payload.get('name_fr') or '').strip(),
        name_en=(payload.get('name_en') or '').strip(),
        name_ber=(payload.get('name_ar') or '').strip(),
        description_ar=(payload.get('description_ar') or '').strip(),
        description_fr=(payload.get('description_fr') or '').strip(),
        description_en=(payload.get('description_en') or '').strip(),
        description_ber=(payload.get('description_ar') or '').strip(),
        category=category,
        status=payload.get('status'),
        condition=payload.get('condition'),
        price_per_unit=Decimal('0'),
        price_period=Item.PERIOD_DAY,
        weekly_price=None,
        monthly_price=None,
        deposit_amount=Decimal('0'),
        quantity_total=quantity_total,
        quantity_available=quantity_available,
        quantity_rented=max(quantity_total - quantity_available, 0),
        storage_location=(payload.get('storage_location') or '').strip(),
        is_featured=bool(payload.get('is_featured')),
        is_active=True,
        tags=(payload.get('tags') or '').strip(),
    )
    return JsonResponse({'detail': 'Item created.', 'item': _item_payload(item, 'ar')})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def staff_categories_create(request):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    payload = _json_body(request)
    name_ar = (payload.get('name_ar') or '').strip()
    name_fr = (payload.get('name_fr') or '').strip()
    name_en = (payload.get('name_en') or '').strip()
    icon = (payload.get('icon') or 'package').strip()
    color = (payload.get('color') or '#c9912e').strip()

    if not all([name_ar, name_fr, name_en]):
        return JsonResponse({'detail': 'All category names are required.'}, status=400)

    if not color.startswith('#') or len(color) != 7:
        color = '#c9912e'

    category = Category.objects.create(
        name_ar=name_ar,
        name_fr=name_fr,
        name_en=name_en,
        name_ber=name_ar,
        icon=icon or 'package',
        color=color,
        slug=_unique_category_slug(name_en, name_fr, name_ar),
        order=(Category.objects.aggregate(max_order=Max('order')).get('max_order') or 0) + 1,
        is_active=True,
    )
    return JsonResponse({'detail': 'Category created.', 'category': _category_payload(category, 'ar')})


@csrf_exempt
@require_http_methods(['PATCH'])
@login_required
def staff_items_update(request, pk):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    try:
        item = Item.objects.get(pk=pk, is_active=True)
    except Item.DoesNotExist:
        return JsonResponse({'detail': 'Item not found.'}, status=404)

    payload = _json_body(request)
    text_fields = ['name_ar', 'name_fr', 'name_en', 'description_ar', 'description_fr', 'description_en', 'storage_location', 'tags']
    for field in text_fields:
        if field in payload:
            setattr(item, field, (payload.get(field) or '').strip())

    if 'name_ar' in payload:
        item.name_ber = item.name_ar
    if 'description_ar' in payload:
        item.description_ber = item.description_ar

    if 'category_id' in payload:
        try:
            item.category = Category.objects.get(pk=payload['category_id'], is_active=True)
        except Category.DoesNotExist:
            return JsonResponse({'detail': 'Invalid category_id.'}, status=400)

    if 'status' in payload and payload.get('status') in {Item.STATUS_AVAILABLE, Item.STATUS_RENTED, Item.STATUS_MAINTENANCE, Item.STATUS_RESERVED, Item.STATUS_RETIRED}:
        item.status = payload.get('status')
    if 'condition' in payload and payload.get('condition') in {Item.CONDITION_NEW, Item.CONDITION_EXCELLENT, Item.CONDITION_GOOD, Item.CONDITION_FAIR, Item.CONDITION_DAMAGED}:
        item.condition = payload.get('condition')

    item.price_per_unit = Decimal('0')
    item.price_period = Item.PERIOD_DAY
    item.weekly_price = None
    item.monthly_price = None
    item.deposit_amount = Decimal('0')

    if 'quantity_total' in payload:
        item.quantity_total = max(_to_int(payload.get('quantity_total'), item.quantity_total), 1)
    if 'quantity_available' in payload:
        item.quantity_available = max(_to_int(payload.get('quantity_available'), item.quantity_available), 0)
    item.quantity_available = min(item.quantity_available, item.quantity_total)
    item.quantity_rented = max(item.quantity_total - item.quantity_available, 0)

    if 'is_featured' in payload:
        item.is_featured = bool(payload.get('is_featured'))

    item.save()
    return JsonResponse({'detail': 'Item updated.', 'item': _item_payload(item, 'ar')})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def staff_item_image_upload(request, pk):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    try:
        item = Item.objects.get(pk=pk, is_active=True)
    except Item.DoesNotExist:
        return JsonResponse({'detail': 'Item not found.'}, status=404)

    image_file = request.FILES.get('image')
    if not image_file:
        return JsonResponse({'detail': 'image file is required.'}, status=400)

    is_main = str(request.POST.get('is_main', '')).lower() in {'1', 'true', 'yes', 'on'}
    caption_ar = (request.POST.get('caption_ar') or '').strip()
    caption_fr = (request.POST.get('caption_fr') or '').strip()

    if is_main:
        ItemImage.objects.filter(item=item, is_main=True).update(is_main=False)

    item_image = ItemImage.objects.create(
        item=item,
        image=image_file,
        is_main=is_main,
        caption_ar=caption_ar,
        caption_fr=caption_fr,
    )

    return JsonResponse(
        {
            'detail': 'Image uploaded.',
            'image': {
                'id': item_image.id,
                'is_main': item_image.is_main,
                'url': request.build_absolute_uri(item_image.image.url) if item_image.image else None,
            },
        }
    )


@require_GET
@login_required
def notifications_list(request):
    queryset = Notification.objects.filter(recipient=request.user).select_related('sender').order_by('-created_at')
    return JsonResponse(
        {
            'count': queryset.count(),
            'unread_count': queryset.filter(is_read=False).count(),
            'results': [_notification_payload(obj) for obj in queryset[:30]],
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def notifications_mark_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return JsonResponse({'detail': 'Notification not found.'}, status=404)

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])

    return JsonResponse({'detail': 'Notification marked as read.', 'notification': _notification_payload(notification)})


@csrf_exempt
@require_http_methods(['POST'])
@login_required
def staff_notifications_create(request):
    if not user_has_staff_access(request.user, [StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER]):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    payload = _json_body(request)
    title = (payload.get('title') or '').strip()
    message = (payload.get('message') or '').strip()
    action_url = (payload.get('action_url') or '').strip()
    recipient_id = payload.get('recipient_id')
    send_to_all = bool(payload.get('send_to_all'))

    if not title or not message:
        return JsonResponse({'detail': 'Title and message are required.'}, status=400)

    recipients = []
    if send_to_all:
        staff_user_ids = StaffProfile.objects.filter(is_active=True).values_list('user_id', flat=True)
        recipients = list(
            User.objects.filter(is_active=True)
            .exclude(is_superuser=True)
            .exclude(id__in=staff_user_ids)
        )
    elif recipient_id:
        try:
            recipients = [User.objects.get(pk=recipient_id, is_active=True)]
        except User.DoesNotExist:
            return JsonResponse({'detail': 'Recipient not found.'}, status=404)
    else:
        return JsonResponse({'detail': 'Select a recipient or choose send to all.'}, status=400)

    created = [
        Notification(recipient=recipient, sender=request.user, title=title, message=message, action_url=action_url)
        for recipient in recipients
    ]
    Notification.objects.bulk_create(created)
    return JsonResponse({'detail': f'Notification sent to {len(created)} recipient(s).'})


@require_GET
def download_report(request):
    """Serve the project academic report PDF as a downloadable file."""
    pdf_path = os.path.join(settings.BASE_DIR, '..', 'تقرير_مشروع_المسرح_الكبير.pdf')
    pdf_path = os.path.normpath(pdf_path)
    if not os.path.isfile(pdf_path):
        raise Http404("ملف التقرير غير موجود.")
    response = FileResponse(
        open(pdf_path, 'rb'),
        content_type='application/pdf',
    )
    response['Content-Disposition'] = 'attachment; filename="تقرير_مشروع_المسرح_الكبير.pdf"'
    return response
