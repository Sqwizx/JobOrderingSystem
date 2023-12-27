from django.contrib.auth.models import User
from django.db import models

class UserRole(models.Model):
    ADMIN = 'admin'
    MANAGER = 'manager'
    PRODUCTION = 'production'
    PACKAGING = 'packaging'
    MIXING = 'mixing'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (PRODUCTION, 'Production'),
        (PACKAGING, 'Packaging'),
        (MIXING, 'Mixing'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=PRODUCTION)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @staticmethod
    def create_user_role(sender, instance, created, **kwargs):
        if created:
            UserRole.objects.get_or_create(user=instance)

from django.db.models.signals import post_save
post_save.connect(UserRole.create_user_role, sender=User)
