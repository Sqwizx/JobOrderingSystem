from django.contrib import admin
from .models import JobOrder, RecipeMapping, Revision, ProductMapping, Activity

admin.site.register(JobOrder)
admin.site.register(Activity)
admin.site.register(RecipeMapping)
admin.site.register(Revision)
admin.site.register(ProductMapping)
