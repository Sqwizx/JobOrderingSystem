from django.contrib import admin
from .models import JobOrder, RecipeMapping, Revision, Product, Activity

admin.site.register(JobOrder)
admin.site.register(Activity)
admin.site.register(RecipeMapping)
admin.site.register(Revision)
admin.site.register(Product)
