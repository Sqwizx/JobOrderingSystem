from django.db import models

# Create your models here.
class Recipe(models.Model):
    recipeName = models.CharField(max_length=50, unique=True)
    productionRate = models.CharField(max_length=50)
    stdBatchSize = models.CharField(max_length=50)
    cycleTimeVariable = models.DurationField()

    def __str__(self):
        return self.recipeName