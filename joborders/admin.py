from django.contrib import admin
from .models import JobOrder, Recipe, Revision, Product, Activity

admin.site.register(JobOrder)
admin.site.register(Activity)
admin.site.register(Recipe)
admin.site.register(Revision)
admin.site.register(Product)
