from django.contrib import admin

from .models import Recipe, Product


admin.site.register(Recipe)
admin.site.register(Product)
