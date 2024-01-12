from django.db import models
from django.utils.timezone import now

class Client(models.Model):
    clientName = models.CharField(max_length=100, null=True)
    poCarton = models.PositiveIntegerField(null=True)
    cartonFinished = models.PositiveIntegerField(default=0, null=True)


    def __str__(self):
        return self.clientName

class PurchaseOrder(models.Model):
    poClients = models.ManyToManyField(Client)
    poStatus = models.CharField(max_length=50, null=True)
    poDeadline = models.DateField(null=True)
    po_id = models.CharField(max_length=20, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.po_id:
            # Format: PO + YYYYMMDD of creation date
            self.po_id = 'PO' + now().strftime('%Y%m%d')
            # Ensure uniqueness, append an incrementing number if needed
            counter = 1
            while PurchaseOrder.objects.filter(po_id=self.po_id).exists():
                self.po_id = 'PO' + now().strftime('%Y%m%d') + f'_{counter}'
                counter += 1
        super(PurchaseOrder, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.po_id}"
