from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User

class Revision(models.Model):
    revisionId = models.CharField(max_length=50)
    dateTime = models.DateTimeField(default=timezone.now)
    userId = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.revisionId

class JobOrder(models.Model):
    jobOrderId = models.CharField(max_length=50, unique=True)
    jobOrderCreatedDate = models.DateTimeField()
    jobOrderStatus = models.CharField(max_length=50)
    userId = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.jobOrderId

class RecipeMapping(models.Model):
    recipeId = models.CharField(max_length=50)
    recipeName = models.CharField(max_length=50)
    recipeProdDate = models.DateField()
    recipeProdRate = models.PositiveIntegerField(null=True)
    recipeBatchSize = models.PositiveIntegerField(null=True)
    recipeTotalSales = models.PositiveIntegerField(null=True)
    recipeBatches = models.PositiveIntegerField(null=True)
    recipeStdTime = models.DurationField(null=True)
    recipeCycleTime = models.DurationField(null=True)
    recipeWaste = models.DecimalField(max_digits=5, decimal_places=2)
    recipeSpongeStartTime = models.DurationField(null=True)
    recipeTotalTray = models.PositiveIntegerField(null=True)
    recipeTotalTrolley = models.PositiveIntegerField(null=True)
    recipeBeltNo = models.PositiveIntegerField(null=True)
    jobOrder = models.ForeignKey(JobOrder, related_name='recipes', on_delete=models.CASCADE)

    def __str__(self):
        return self.recipeId
    
    
class Activity(models.Model):
    cutOffTime = models.DateTimeField()
    spongeStart = models.DateTimeField()
    spongeEnd = models.DateTimeField()
    doughStart = models.DateTimeField()
    doughEnd = models.DateTimeField()
    firstLoafPacked = models.DateTimeField()
    recipe = models.ForeignKey(RecipeMapping, on_delete=models.CASCADE, related_name="activity_recipe")

    def __str__(self):
        # Assuming there's a ForeignKey from Activity to Recipe
        return f"{self.recipe.recipeId}'s Activity"

class Product(models.Model):
    productId = models.CharField(max_length=50, unique=True, null=True)
    productName = models.CharField(max_length=100, null=True)
    productSalesOrder = models.PositiveIntegerField(null=True)
    currency = models.CharField(max_length=3, null=True)  # Assuming currency codes like 'SGD', 'MYR'
    productPrice = models.DecimalField(max_digits=10, decimal_places=2)
    client = models.CharField(max_length=100, null=True)
    colorSet = models.CharField(max_length=100, null=True)  # Assuming this can be optional
    productExpDate = models.DateTimeField(null=True)
    productSaleDate = models.DateTimeField(null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True)  # Assuming weight might need decimal values
    noOfSlices = models.PositiveIntegerField(null=True)
    thickness = models.PositiveIntegerField(null=True)
    tray = models.PositiveIntegerField(null=True)  # Assuming this can be optional
    trolley = models.PositiveIntegerField(null=True)  # Assuming this can be optional
    productRemarks = models.TextField(blank=True, null=True)  # Text fields are better for longer, variable-length text
    recipe = models.ForeignKey(RecipeMapping, on_delete=models.CASCADE, related_name="products", null=True)  # Removed the null=True since ForeignKey should not be null in most cases

    def __str__(self):
        return self.productId
