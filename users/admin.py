from django.contrib import admin
from .models import User

admin.site.site_header = "FarmLand Job Ordering System"
admin.site.register(User)
