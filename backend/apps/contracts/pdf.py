from io import BytesIO
import base64
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
from django.core import signing
import os

def render_html(template_name, context):
    html = render_to_string(template_name, context)
    return HttpResponse(html)

def render_pdf(template_name, context, filename='document.pdf'):
    try:
        from weasyprint import HTML, CSS
    except Exception:
        return render_html(template_name, context)

    html_string = render_to_string(template_name, context)
    base_url = settings.BASE_DIR
    css_path = os.path.join(settings.BASE_DIR, 'templates', 'pdf', 'styles', 'document.css')
    pdf_file = BytesIO()
    HTML(string=html_string, base_url=base_url).write_pdf(
        target=pdf_file,
        stylesheets=[CSS(filename=css_path)] if os.path.exists(css_path) else None
    )
    pdf_file.seek(0)
    response = HttpResponse(pdf_file.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    return response


def build_signed_verify_url(request, ref):
    token = signing.dumps({'ref': ref})
    return request.build_absolute_uri(f"/contracts/verify/?ref={ref}&token={token}")


def build_qr_data_uri(value):
    try:
        import qrcode
    except Exception:
        return ''

    img = qrcode.make(value)
    stream = BytesIO()
    img.save(stream, format='PNG')
    encoded = base64.b64encode(stream.getvalue()).decode('ascii')
    return f"data:image/png;base64,{encoded}"
