# Generated by Django 4.2.6 on 2023-12-04 07:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('joborders', '0008_delete_recipeperday'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipemapping',
            name='recipeGap',
            field=models.DurationField(null=True),
        ),
    ]
