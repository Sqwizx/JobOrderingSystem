# Generated by Django 4.2.6 on 2023-12-07 03:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('joborders', '0009_recipemapping_recipegap'),
    ]

    operations = [
        migrations.AlterField(
            model_name='recipemapping',
            name='recipeSpongeStartTime',
            field=models.DateField(),
        ),
    ]