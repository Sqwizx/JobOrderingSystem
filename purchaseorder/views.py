from django.shortcuts import render

from purchaseorder.models import PurchaseOrder

# Create your views here.

def po_dashboard(request):
    purchase_orders = PurchaseOrder.objects.all()  # Fetch all purchase orders

    context = {
        'purchase_orders': purchase_orders
    }

    return render(request, 'po_dashboard.html', context)