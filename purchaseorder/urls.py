from django.urls import path
from purchaseorder import views

urlpatterns = [
    path('purchaseorder/', views.po_dashboard, name='podashboard'),
]