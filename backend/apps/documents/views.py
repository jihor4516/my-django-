from django.shortcuts import redirect, get_object_or_404, render
from django.contrib import messages
from django.conf import settings
from django.utils import timezone
from .models import ExternalDocument, DocumentItem
from apps.inventory.models import Item
from apps.contracts.pdf import render_pdf
from apps.accounts.models import StaffProfile
from apps.accounts.permissions import staff_role_required
from apps.dashboard.models import SystemSettings
from django.templatetags.static import static
import uuid


DOC_TYPE_TITLES = {
    'decharge': 'Décharge',
    'reception': 'Bon de Réception',
    'commande': 'Bon de Commande',
    'pv': 'Procès-verbal',
}


def _document_context(request, doc):
    document_items = list(doc.documentitem_set.select_related('item').all())
    document_rows = []
    for index, doc_item in enumerate(document_items, start=1):
        document_rows.append(
            {
                'num': index,
                'designation': doc_item.item.name_fr or doc_item.item.name_en or doc_item.item.name_ar,
                'quantity': doc_item.quantity,
                'observations': doc_item.notes or doc_item.return_condition or '',
            }
        )

    return {
        'doc': doc,
        'system_settings': SystemSettings.get_solo(),
        'logo_url': request.build_absolute_uri(static('images/theatre/logofacture.png')),
        'document_title': DOC_TYPE_TITLES.get(doc.doc_type, 'Document'),
        'document_rows': document_rows,
        'blank_rows': range(max(0, 10 - len(document_rows))),
        'auto_print': request.GET.get('print') == '1',
    }

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def document_list(request):
    return redirect(f"{settings.FRONTEND_APP_URL}/documents")

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def document_create(request):
    if request.method == 'POST':
        doc_type = request.POST.get('doc_type')
        external_name = request.POST.get('external_name')
        external_contact = request.POST.get('external_contact')
        purpose = request.POST.get('purpose')
        
        # Generate Doc Number
        prefix = {
            'decharge': 'DS',
            'reception': 'BR',
            'commande': 'BC',
            'pv': 'PV'
        }.get(doc_type, 'DOC')
        year = timezone.now().year
        # Simple unique ID for now
        uid = str(uuid.uuid4().int)[:4]
        doc_number = f"{prefix}-{year}-{uid}"
        
        doc = ExternalDocument.objects.create(
            doc_type=doc_type,
            doc_number=doc_number,
            external_name=external_name,
            external_contact=external_contact,
            purpose=purpose,
            created_by=request.user,
            status='active'
        )
        
        # Handle Items (assuming dynamic form inputs like item_id_1, qty_1, etc.)
        item_ids = request.POST.getlist('item_ids')
        quantities = request.POST.getlist('quantities')
        
        for i, item_id in enumerate(item_ids):
            if item_id and quantities[i]:
                try:
                    item = Item.objects.get(id=item_id)
                    qty = int(quantities[i])
                    DocumentItem.objects.create(document=doc, item=item, quantity=qty)
                except Item.DoesNotExist:
                    continue
        
        messages.success(request, f'Document {doc_number} created successfully.')
        return redirect('documents:detail', pk=doc.pk)
        
    return redirect(f"{settings.FRONTEND_APP_URL}/documents")

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def document_detail(request, pk):
    doc = get_object_or_404(ExternalDocument, pk=pk)
    return render(request, 'pdf/document.html', _document_context(request, doc))


@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def document_preview(request, pk):
    doc = get_object_or_404(ExternalDocument, pk=pk)
    return render(request, 'pdf/document.html', _document_context(request, doc))

@staff_role_required(StaffProfile.ROLE_SUPER_ADMIN, StaffProfile.ROLE_MANAGER, StaffProfile.ROLE_STOREKEEPER)
def document_pdf(request, pk):
    doc = get_object_or_404(ExternalDocument, pk=pk)
    return render_pdf('pdf/document.html', _document_context(request, doc), filename=f'{doc.doc_number}.pdf')
