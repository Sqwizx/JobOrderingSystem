from django.contrib import admin
from .models import JobOrder,  Activity, Recipe, Revision, Product 

admin.site.register(JobOrder)
admin.site.register(Activity)
admin.site.register(Recipe)
admin.site.register(Revision)
admin.site.register(Product)
