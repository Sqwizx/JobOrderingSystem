# Generated by Django 4.2.6 on 2023-11-23 06:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('joborders', '0002_product_recipe'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='productSlice',
        ),
        migrations.RemoveField(
            model_name='product',
            name='productThickness',
        ),
        migrations.AddField(
            model_name='product',
            name='client',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='colorSet',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='currency',
            field=models.CharField(max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='noOfSlices',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='productName',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='thickness',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='tray',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='trolley',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='weight',
            field=models.DecimalField(decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='productExpDate',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='productId',
            field=models.CharField(max_length=50, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='productPrice',
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name='product',
            name='productRemarks',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='productSaleDate',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='productSalesOrder',
            field=models.PositiveIntegerField(null=True),
        ),
    ]