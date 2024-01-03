# Generated by Django 4.2.6 on 2023-11-23 05:33

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='JobOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('jobOrderId', models.CharField(max_length=50, unique=True)),
                ('jobOrderCreatedDate', models.DateTimeField()),
                ('jobOrderStatus', models.CharField(max_length=50)),
                ('userId', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('productId', models.CharField(max_length=50)),
                ('productPrice', models.DecimalField(decimal_places=2, max_digits=5)),
                ('productSalesOrder', models.PositiveIntegerField()),
                ('productThickness', models.PositiveIntegerField()),
                ('productSlice', models.CharField(max_length=50)),
                ('productExpDate', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('productSaleDate', models.DateTimeField(blank=True, default=django.utils.timezone.now, null=True)),
                ('productRemarks', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='Revision',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('revisionId', models.CharField(max_length=50)),
                ('dateTime', models.DateTimeField(default=django.utils.timezone.now)),
                ('userId', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Recipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipeId', models.CharField(max_length=50)),
                ('recipeName', models.CharField(max_length=50)),
                ('recipeProdDate', models.DateField()),
                ('recipeProdRate', models.PositiveIntegerField(null=True)),
                ('recipeBatchSize', models.PositiveIntegerField(null=True)),
                ('recipeTotalSales', models.PositiveIntegerField(null=True)),
                ('recipeBatches', models.PositiveIntegerField(null=True)),
                ('recipeStdTime', models.DurationField(null=True)),
                ('recipeCycleTime', models.DurationField(null=True)),
                ('recipeWaste', models.DecimalField(decimal_places=2, max_digits=5)),
                ('recipeSpongeStartTime', models.DurationField(null=True)),
                ('recipeTotalTray', models.PositiveIntegerField(null=True)),
                ('recipeTotalTrolley', models.PositiveIntegerField(null=True)),
                ('recipeBeltNo', models.PositiveIntegerField(null=True)),
                ('jobOrder', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipes', to='joborders.joborder')),
            ],
        ),
        migrations.CreateModel(
            name='Activity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cutOffTime', models.DateTimeField()),
                ('spongeStart', models.DateTimeField()),
                ('spongeEnd', models.DateTimeField()),
                ('doughStart', models.DateTimeField()),
                ('doughEnd', models.DateTimeField()),
                ('firstLoafPacked', models.DateTimeField()),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activity_recipe', to='joborders.recipe')),
            ],
        ),
    ]