from django.db import models

# Create your models here.
class Recipe(models.Model):
    recipeName = models.CharField(max_length=50, unique=True)
    productionRate = models.PositiveIntegerField()
    stdBatchSize = models.PositiveIntegerField()
    cycleTimeVariable = models.DurationField()

    def __str__(self):
        return self.recipeName