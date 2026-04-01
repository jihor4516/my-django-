from django.shortcuts import redirect, get_object_or_404
from django.conf import settings
from django.db.models import Q
from .models import Category, Item
from django.core.paginator import Paginator


def home(request):
    return redirect(settings.FRONTEND_APP_URL)

def catalogue(request):
    query = request.META.get('QUERY_STRING', '')
    target = f"{settings.FRONTEND_APP_URL}/catalogue"
    if query:
        target = f"{target}?{query}"
    return redirect(target)

def item_detail(request, pk):
    get_object_or_404(Item, pk=pk, is_active=True)
    return redirect(f"{settings.FRONTEND_APP_URL}/items/{pk}")
