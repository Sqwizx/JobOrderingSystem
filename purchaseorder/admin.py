from django.contrib import admin
from .models import Client, PurchaseOrder

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('clientName', 'poCarton', 'cartonFinished')
    search_fields = ('clientName',)

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_id', 'poStatus', 'poDeadline')
    search_fields = ('po_id',)
    filter_horizontal = ('poClients',)  # User-friendly widget for managing many-to-many relationships
