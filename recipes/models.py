from django.db import models

# Create your models here.
class Recipe(models.Model):
    recipeName = models.CharField(max_length=50, unique=True)
    productionRate = models.PositiveIntegerField()
    stdBatchSize = models.PositiveIntegerField()
    cycleTimeVariable = models.DurationField()

    def __str__(self):
        return self.recipeName

class Product(models.Model):
    productName = models.CharField(max_length=100, null=True)
    currency = models.CharField(max_length=3, null=True)
    productPrice = models.DecimalField(max_digits=10, decimal_places=2)
    client = models.CharField(max_length=100, null=True)
    weight = models.PositiveIntegerField(null=True)
    noOfSlices = models.PositiveIntegerField(null=True)
    thickness = models.PositiveIntegerField(null=True)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="products", null=True)

    def __str__(self):
        return self.productName