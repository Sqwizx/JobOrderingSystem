# Generated by Django 4.2.6 on 2024-01-15 07:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0005_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='client',
            field=models.CharField(max_length=100, null=True),
        ),
    ]
