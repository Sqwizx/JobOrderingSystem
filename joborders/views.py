import json
from datetime import datetime, timedelta
from django.shortcuts import render
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db import transaction
from .models import RecipeMapping, JobOrder, Activity, Product
from decimal import Decimal
import pytz

from django.contrib.auth.decorators import login_required

@login_required
def create_joborder(request):
    if request.method == 'GET' and 'selected_date' in request.GET:
        selected_date = request.GET.get('selected_date')
        current_date = datetime.strptime(selected_date, '%Y-%m-%d')
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        date_info = [{'date': (current_date + timedelta(days=i)).strftime('%d'), 'day': days[(current_date + timedelta(days=i)).weekday()]} for i in range(7)]
        return JsonResponse({'date_info': date_info, 'current_date': current_date.strftime('%Y-%m-%d')})
    else:
        current_date = datetime.now()
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        date_info = [{'date': (current_date + timedelta(days=i)).strftime('%d'), 'day': days[(current_date + timedelta(days=i)).weekday()]} for i in range(7)]
        return render(request, 'create_joborder.html', {'date_info': date_info, 'current_date': current_date})

@login_required
@require_POST
def save_recipes(request):
    aware = pytz.timezone('Asia/Kuala_Lumpur')
    data = json.loads(request.body)
    recipes_data = data.get('recipes', [])
    job_order_id = 'JO{}'.format(timezone.localtime().strftime('%d%m%Y%H%M%S'))

    with transaction.atomic():
        job_order = JobOrder.objects.create(
            jobOrderId=job_order_id,
            jobOrderCreatedDate=timezone.localtime(),
            jobOrderStatus='DRAFT',
            userId=request.user,
        )
        
        for recipe_data in recipes_data:
            sponge_start = aware.localize(datetime.strptime(recipe_data['spongeStartTime'], '%A, %d %b %Y %H:%M'))
            sponge_end = aware.localize(datetime.strptime(recipe_data['spongeEndTime'], '%A, %d %b %Y %H:%M'))
            dough_start = aware.localize(datetime.strptime(recipe_data['doughStartTime'], '%A, %d %b %Y %H:%M'))
            dough_end = aware.localize(datetime.strptime(recipe_data['doughEndTime'], '%A, %d %b %Y %H:%M'))
            first_loaf_packed = aware.localize(datetime.strptime(recipe_data['firstLoafPacked'], '%A, %d %b %Y %H:%M'))
            cut_off = aware.localize(datetime.strptime(recipe_data['cutOffTime'], '%A, %d %b %Y %H:%M'))
            std_hours, std_minutes, std_seconds = map(int, recipe_data.get('stdTime', '00:00:00').split(':'))
            cycle_hours, cycle_minutes, cycle_seconds = map(int, recipe_data.get('cycleTime', '00:00:00').split(':'))
                    # Extract activity-related data from recipe_data
            activity_data = {
                'spongeStart': sponge_start,
                'spongeEnd': sponge_end,
                'doughStart': dough_start,
                'doughEnd': dough_end,
                'firstLoafPacked': first_loaf_packed,
                'cutOffTime': cut_off,
            }

            # Now create an 'activities' key in recipe_data that contains the extracted info
            recipe_data['activities'] = [activity_data]  # Here we create a list with a single activity

            # Remove the activity-related data from the recipe_data since it's now in 'activities'
            del recipe_data['spongeStartTime']
            del recipe_data['spongeEndTime']
            del recipe_data['doughStartTime']
            del recipe_data['doughEndTime']
            del recipe_data['firstLoafPacked']
            del recipe_data['cutOffTime']

            
            recipe_prod_date = aware.localize(datetime.strptime(recipe_data['dateTimePicker'], '%A, %d %b %Y'))

            # Create `timedelta` objects
            std_time_delta = timedelta(hours=std_hours, minutes=std_minutes, seconds=std_seconds)
            cycle_time_delta = timedelta(hours=cycle_hours, minutes=cycle_minutes, seconds=cycle_seconds)

            recipe_id = '{}_{}'.format(job_order_id, recipe_data['recipeName'])
            # Create the Recipe instance
            recipe = RecipeMapping.objects.create(
                recipeId=recipe_id,
                jobOrder=job_order,
                recipeName=recipe_data['recipeName'],
                recipeProdDate=recipe_prod_date,
                recipeProdRate=int(recipe_data['productionRate']),
                recipeBatchSize=int(recipe_data.get('batchSize', 0)),
                recipeTotalSales=int(recipe_data.get('salesOrder', 0)),
                recipeBatches=int(recipe_data.get('batches', 0)),
                recipeStdTime=std_time_delta,
                recipeCycleTime=cycle_time_delta,
                recipeWaste=float(recipe_data.get('waste', 0)),
                recipeTotalTray=int(recipe_data.get('totalTray', 0)),
                recipeTotalTrolley=int(recipe_data.get('totalTrolley', 0)),
                recipeBeltNo=int(recipe_data.get('beltNo', 0)),
            )
            
            # Create multiple Activity instances for each Recipe
            for activity_data in recipe_data['activities']:
                Activity.objects.create(
                    recipe=recipe,  # Assuming you have a ForeignKey to Recipe in Activity
                    spongeStart=sponge_start,
                    spongeEnd=sponge_end,
                    doughStart=dough_start,
                    doughEnd=dough_end,
                    firstLoafPacked=first_loaf_packed,
                    cutOffTime=cut_off,
            # Associate with the Recipe instance
                )

            # Process and save products for the recipe
            for product_data in recipe_data.get('products', []):
                    # Check if 'expiryDate' is in product_data and is not an empty string
                product_exp_date = product_data.get('expiryDate')
                product_exp_date = aware.localize(datetime.strptime(product_data['expiryDate'], '%Y-%m-%d')) if product_exp_date else None

                # Check if 'saleDate' is in product_data and is not an empty string
                product_sale_date = product_data.get('saleDate')
                product_sale_date = aware.localize(datetime.strptime(product_data['saleDate'], '%Y-%m-%d')) if product_sale_date else None
                
                product_id = '{}_{}'.format(recipe.recipeId, product_data['name'].replace(' ', ''))
                Product.objects.create(
                productId=product_id,
                recipe=recipe,
                productName=product_data['name'],
                productSalesOrder=product_data['salesOrder'],
                productPrice=Decimal(product_data['productPrice']),
                currency=product_data['currency'],
                client=product_data['client'],
                colorSet=product_data.get('color'),  # Assuming this is how you store color, and it's optional
                productExpDate=product_exp_date,
                productSaleDate=product_sale_date,
                noOfSlices=int(product_data['noOfSlices']),
                thickness=float(product_data['thickness']),
                weight=int(product_data['weight']),
                tray=int(product_data.get('tray', 0)),  # Defaulting to 0 if not provided
                trolley=int(product_data.get('trolley', 0)),  # Defaulting to 0 if not provided
                productRemarks=product_data.get('remarks', '')  # Defaulting to empty string if not provided
            )

    return JsonResponse({'status': 'success'})