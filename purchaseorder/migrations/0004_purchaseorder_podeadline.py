# Generated by Django 4.2.6 on 2024-01-03 06:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchaseorder', '0003_alter_purchaseorder_poclients'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorder',
            name='poDeadline',
            field=models.DateField(null=True),
        ),
    ]