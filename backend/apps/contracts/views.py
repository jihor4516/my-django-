from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from .models import RentalContract
from .pdf import render_pdf
from apps.inventory.models import Item
from apps.dashboard.models import SystemSettings
from .models import RentalRequest
from django.views.decorators.http import require_GET
from django.utils.dateparse import parse_date
from django.core import signing
from django.http import JsonResponse
from django.templatetags.static import static
from apps.accounts.permissions import user_has_staff_access


def _can_access_contract_document(user, contract):
    if user_has_staff_access(user):
        return True
    user_id = getattr(user, 'id', None)
    user_email = (getattr(user, 'email', '') or '').strip().lower()
    tenant_email = (getattr(contract.tenant, 'email', '') or '').strip().lower()
    if contract.tenant.created_by_id == user_id:
        return True
    return bool(user_email and tenant_email and user_email == tenant_email)


def _contract_has_return_data(contract):
    if contract.actual_return_date:
        return True
    if contract.status == RentalContract.STATUS_COMPLETED:
        return True
    return contract.contractitem_set.filter(returned=True).exists()


def _contract_context(request, contract):
    system_settings = SystemSettings.get_solo()
    return {
        'contract': contract,
        'system_settings': system_settings,
        'logo_url': request.build_absolute_uri(static('images/theatre/logofacture.png')),
        'auto_print': request.GET.get('print') == '1',
    }


def _return_document_context(request, contract):
    system_settings = SystemSettings.get_solo()
    items = list(contract.contractitem_set.select_related('item').all())
    document_rows = []
    for index, contract_item in enumerate(items, start=1):
        document_rows.append(
            {
                'num': index,
                'designation': contract_item.item.name_fr or contract_item.item.name_en or contract_item.item.name_ar,
                'quantity': contract_item.quantity,
                'observations': contract_item.return_condition or contract_item.damage_noted or '',
            }
        )
    return {
        'contract': contract,
        'tenant': contract.tenant,
        'system_settings': system_settings,
        'logo_url': request.build_absolute_uri(static('images/theatre/logofacture.png')),
        'document_rows': document_rows,
        'blank_rows': range(max(0, 11 - len(document_rows))),
        'return_date': contract.actual_return_date or contract.end_date,
        'auto_print': request.GET.get('print') == '1',
    }

@login_required
def contract_preview_view(request, pk):
    contract = get_object_or_404(RentalContract.objects.select_related('tenant'), pk=pk)
    if not _can_access_contract_document(request.user, contract):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    return render(request, 'pdf/contract.html', _contract_context(request, contract))


@login_required
def contract_pdf_view(request, pk):
    contract = get_object_or_404(RentalContract.objects.select_related('tenant'), pk=pk)
    if not _can_access_contract_document(request.user, contract):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    return render_pdf('pdf/contract.html', _contract_context(request, contract), filename=f'contract-{contract.contract_number}.pdf')


@login_required
def return_document_pdf_view(request, pk):
    contract = get_object_or_404(RentalContract.objects.select_related('tenant'), pk=pk)
    if not _can_access_contract_document(request.user, contract):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    if not _contract_has_return_data(contract):
        return JsonResponse({'detail': 'Return document is not available yet.'}, status=400)
    return render_pdf('pdf/restitution_fr.html', _return_document_context(request, contract), filename=f'return-document-{contract.contract_number}.pdf')


@login_required
def return_document_preview_view(request, pk):
    contract = get_object_or_404(RentalContract.objects.select_related('tenant'), pk=pk)
    if not _can_access_contract_document(request.user, contract):
        return JsonResponse({'detail': 'Forbidden.'}, status=403)
    if not _contract_has_return_data(contract):
        return JsonResponse({'detail': 'Return document is not available yet.'}, status=400)
    return render(request, 'pdf/restitution_fr.html', _return_document_context(request, contract))

@login_required
def create_rental_request(request, item_id):
    item = get_object_or_404(Item, pk=item_id, is_active=True)
    if request.method == 'POST':
        qty = int(request.POST.get('qty', '1') or 1)
        event_name = (request.POST.get('event_name') or '').strip()
        venue = (request.POST.get('venue') or '').strip()
        start_date = parse_date((request.POST.get('start_date') or '').strip())
        end_date = parse_date((request.POST.get('end_date') or '').strip())
        note = request.POST.get('note', '').strip()
        RentalRequest.objects.create(
            user=request.user,
            item=item,
            qty=max(1, qty),
            event_name=event_name,
            venue=venue,
            start_date=start_date,
            end_date=end_date,
            note=note,
        )
        return redirect('inventory:item-detail', pk=item.id)
    return redirect('inventory:item-detail', pk=item.id)

@require_GET
def verify_view(request):
    ref = request.GET.get('ref', '').strip()
    token = request.GET.get('token', '').strip()
    ctx = {'ref': ref, 'contract': None}

    if token:
        try:
            payload = signing.loads(token)
            if payload.get('ref') != ref:
                return JsonResponse(ctx)
        except signing.BadSignature:
            return JsonResponse(ctx)

    if ref:
        try:
            ctx['contract'] = RentalContract.objects.select_related('tenant').get(contract_number=ref)
        except RentalContract.DoesNotExist:
            pass
    return JsonResponse(
        {
            'ref': ref,
            'contract': {
                'id': ctx['contract'].id,
                'contract_number': ctx['contract'].contract_number,
                'tenant': ctx['contract'].tenant.full_name,
                'start_date': ctx['contract'].start_date,
                'end_date': ctx['contract'].end_date,
            } if ctx['contract'] else None,
        }
    )
