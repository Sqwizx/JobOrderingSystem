from datetime import date, timedelta
from django.utils import timezone
from django.db import models

from users.models import User

class Product(models.Model):
    productId = models.CharField(max_length=50)
    productPrice = models.DecimalField(decimal_places=2, max_digits=5)
    productSalesOrder = models.PositiveIntegerField()
    productThickness = models.PositiveIntegerField()
    productSlice = models.CharField(max_length=50)
    productExpDate = models.DateTimeField(default=timezone.now, blank=True, null=True)
    productSaleDate = models.DateTimeField(default=timezone.now, blank=True, null=True)
    productRemarks = models.CharField(max_length=50)

class Revision(models.Model):
    revisionId = models.CharField(max_length=50)
    dateTime = models.DateTimeField(default=timezone.now)
    userId = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.revisionId

class Recipe(models.Model):
    def yesterday():
        return date.today() - timedelta(days=1)
    
    recipeId = models.CharField(max_length=50)
    recipeSalesOrder = models.PositiveIntegerField(null=True)
    recipeProdRate = models.PositiveIntegerField(null=True)
    recipeBatchSize = models.PositiveIntegerField(null=True)
    recipeProdDate = models.DateField(default=yesterday)
    recipeKwikLokColor = models.CharField(max_length=50,null=True)
    recipeBatches = models.PositiveIntegerField(null=True)
    recipeCycleTime = models.DurationField(null=True)
    recipeWaste = models.DecimalField(max_digits=5, decimal_places=2, default=2.00)
    recipeReqTime = models.DurationField(null=True)
    recipeTotalTray = models.PositiveBigIntegerField(null=True)
    recipeTotalTrolley = models.PositiveIntegerField(null=True)
    recipeBeltNo = models.PositiveIntegerField(null=True)
    recipeProducts = models.ForeignKey(Product, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.recipeId

class Activity(models.Model):
    cutOffTime = models.DateTimeField()
    spongeStart = models.DateTimeField()
    spongeEnd = models.DateTimeField()
    doughStart = models.DateTimeField()
    doughEnd = models.DateTimeField()
    firstLoafPacked = models.DateTimeField()
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="activity_recipe")

    def __str__(self):
        # Assuming there's a ForeignKey from Activity to Recipe
        return f"{self.recipe.recipeId}'s Activity"

class JobOrder(models.Model):
    jobOrderId = models.CharField(max_length=50)
    jobOrderCreatedDate = models.DateTimeField(default=timezone.now)
    totalSalesOrder = models.PositiveIntegerField()
    jobOrderStatus = models.CharField(max_length=50)
    currentActivity = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='current')
    nextActivity = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='next')
    jobOrderRevision = models.ForeignKey(Revision, on_delete=models.CASCADE, related_name="job_revision")
    recipeId = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='job_recipe')
    userId = models.ForeignKey(User, on_delete=models.CASCADE, related_name = 'user_job')

    def __str__(self):
        return self.jobOrderId


    
