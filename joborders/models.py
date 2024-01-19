from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User

class JobOrder(models.Model):
    jobOrderId = models.CharField(max_length=50, unique=True)
    jobOrderCreatedDate = models.DateTimeField()
    jobOrderStatus = models.CharField(max_length=50)
    userId = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.jobOrderId

class Revision(models.Model):
    revisionId = models.CharField(max_length=100, blank=True, null=True)  # Increased length and made it blank
    dateTime = models.DateTimeField(default=timezone.now, null=True)
    userId = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    revision = models.CharField(max_length=255, blank=True, null=True)
    jobOrder = models.ForeignKey(JobOrder, on_delete=models.CASCADE, related_name='revisions', null=True)
    ammended = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.revisionId:
            # Format the date as YYYYMMDD
            date_str = timezone.now().strftime("%Y%m%d")
            self.revisionId = f"R{self.jobOrder.jobOrderId}{date_str}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.revisionId

class RecipeMapping(models.Model):
    recipeId = models.CharField(max_length=50)
    recipeName = models.CharField(max_length=50)
    recipeProdDate = models.DateField()
    recipeTimeVar = models.DurationField(max_length=50, null=True)
    recipeProdRate = models.PositiveIntegerField(null=True)
    recipeBatchSize = models.PositiveIntegerField(null=True)
    recipeTotalSales = models.PositiveIntegerField(null=True)
    recipeBatches = models.PositiveIntegerField(null=True)
    recipeStdTime = models.DurationField(null=True)
    recipeCycleTime = models.DurationField(null=True)
    recipeWaste = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    recipeSpongeStartTime = models.DateTimeField(null=True)
    recipeTotalTray = models.PositiveIntegerField(null=True)
    recipeTotalTrolley = models.PositiveIntegerField(null=True)
    recipeBeltNo = models.PositiveIntegerField(null=True)
    recipeGap = models.DurationField(null=True)
    isDraft = models.BooleanField(null=True)
    jobOrder = models.ForeignKey(JobOrder, related_name='recipes', on_delete=models.CASCADE)

    def __str__(self):
        return self.recipeId
    
class Activity(models.Model):
    cutOffTime = models.DateTimeField(null=True)
    spongeStart = models.DateTimeField(null=True)
    spongeEnd = models.DateTimeField(null=True)
    doughStart = models.DateTimeField(null=True)
    doughEnd = models.DateTimeField(null=True)
    firstLoafPacked = models.DateTimeField(null=True)
    recipe = models.ForeignKey(RecipeMapping, on_delete=models.CASCADE, related_name="activity_recipe")

    def __str__(self):
        # Assuming there's a ForeignKey from Activity to Recipe
        return f"{self.recipe.recipeId}'s Activity"

class ProductMapping(models.Model):
    productId = models.CharField(max_length=50, unique=True, null=True)
    productName = models.CharField(max_length=100, null=True)
    productSalesOrder = models.PositiveIntegerField(null=True)
    currency = models.CharField(max_length=3, null=True)
    productPrice = models.DecimalField(max_digits=10, decimal_places=2)
    client = models.CharField(max_length=100, null=True)
    colorSet = models.CharField(max_length=100, null=True)
    productExpDate = models.DateField(null=True)
    productSaleDate = models.DateField(null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    noOfSlices = models.PositiveIntegerField(null=True)
    thickness = models.PositiveIntegerField(null=True)
    tray = models.PositiveIntegerField(null=True)
    trolley = models.PositiveIntegerField(null=True)
    productRemarks = models.TextField(blank=True, null=True)
    recipe = models.ForeignKey(RecipeMapping, on_delete=models.CASCADE, related_name="products", null=True)

    def __str__(self):
        return self.productId
