import json
import pytz
from decimal import Decimal
from recipes.models import Recipe
from django.db import transaction
from django.utils import timezone
from django.shortcuts import render
from django.http import JsonResponse
from datetime import datetime, timedelta
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .models import RecipeMapping, JobOrder, Activity, Product, RecipePerDay

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
        
        recipe_per_day_dict = {}
        for recipe_data in recipes_data:
            # Parse the datetime strings into aware datetime objects
            sponge_start = aware.localize(datetime.strptime(recipe_data['spongeStartTime'], '%A, %d %b %Y %H:%M'))
            sponge_end = aware.localize(datetime.strptime(recipe_data['spongeEndTime'], '%A, %d %b %Y %H:%M'))
            dough_start = aware.localize(datetime.strptime(recipe_data['doughStartTime'], '%A, %d %b %Y %H:%M'))
            dough_end = aware.localize(datetime.strptime(recipe_data['doughEndTime'], '%A, %d %b %Y %H:%M'))
            first_loaf_packed = aware.localize(datetime.strptime(recipe_data['firstLoafPacked'], '%A, %d %b %Y %H:%M'))
            cut_off = aware.localize(datetime.strptime(recipe_data['cutOffTime'], '%A, %d %b %Y %H:%M'))
            std_hours, std_minutes, std_seconds = map(int, recipe_data.get('stdTime', '00:00:00').split(':'))
            cycle_hours, cycle_minutes, cycle_seconds = map(int, recipe_data.get('cycleTime', '00:00:00').split(':'))
            
            # Extract the gap value
            gap_hours, gap_minutes, gap_seconds = map(int, recipe_data.get('gap', '00:00:00').split(':'))
            gap_time_delta = timedelta(hours=gap_hours, minutes=gap_minutes, seconds=gap_seconds)

            recipe_prod_date = aware.localize(datetime.strptime(recipe_data['dateTimePicker'], '%A, %d %b %Y'))

            recipe_per_day = recipe_per_day_dict.get(recipe_prod_date)
            if recipe_per_day is None:
                recipe_per_day, created = RecipePerDay.objects.get_or_create(
                    jobOrder=job_order,
                    production_date=recipe_prod_date,
                    defaults={'gap': gap_time_delta}
                )
                recipe_per_day_dict[recipe_prod_date] = recipe_per_day
                if not created and recipe_per_day.gap != gap_time_delta:
                    recipe_per_day.gap = gap_time_delta
                    recipe_per_day.save()

            # Create RecipeMapping instance
            std_time_delta = timedelta(hours=std_hours, minutes=std_minutes, seconds=std_seconds)
            cycle_time_delta = timedelta(hours=cycle_hours, minutes=cycle_minutes, seconds=cycle_seconds)
            recipe_id = '{}_{}'.format(job_order_id, recipe_data['recipeName'])
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
            
            if created or recipe not in recipe_per_day.recipes.all():
                recipe_per_day.recipes.add(recipe)

            # Create Activity instances
            Activity.objects.create(
                recipe=recipe,
                spongeStart=sponge_start,
                spongeEnd=sponge_end,
                doughStart=dough_start,
                doughEnd=dough_end,
                firstLoafPacked=first_loaf_packed,
                cutOffTime=cut_off,
            )

            # Process and save products for the recipe
            for product_data in recipe_data.get('products', []):
                product_exp_date = product_data.get('expiryDate')
                if product_exp_date:
                    product_exp_date = aware.localize(datetime.strptime(product_exp_date, '%A, %d %b %Y'))

                product_sale_date = product_data.get('saleDate')
                if product_sale_date:
                    product_sale_date = aware.localize(datetime.strptime(product_sale_date, '%A, %d %b %Y'))

                product_id = '{}_{}'.format(recipe.recipeId, product_data['name'].replace(' ', ''))
                Product.objects.create(
                    productId=product_id,
                    recipe=recipe,
                    productName=product_data['name'],
                    productSalesOrder=int(product_data['salesOrder']),
                    productPrice=Decimal(product_data['productPrice']),
                    currency=product_data['currency'],
                    client=product_data['client'],
                    colorSet=product_data.get('color'),
                    productExpDate=product_exp_date,
                    productSaleDate=product_sale_date,
                    noOfSlices=int(product_data['noOfSlices']),
                    thickness=float(product_data['thickness']),
                    weight=int(product_data['weight']),
                    tray=int(product_data.get('tray', 0)),
                    trolley=int(product_data.get('trolley', 0)),
                    productRemarks=product_data.get('remarks', ''),
                )

    return JsonResponse({'status': 'success'})

def search_recipes(request):
    query = request.GET.get('query', '')
    recipes = Recipe.objects.filter(recipeName__icontains=query)

    # Prepare the data for JSON response
    recipe_data = []
    for recipe in recipes:
        recipe_dict = {
            'id': recipe.id,
            'recipeName': recipe.recipeName,
            'cycleTimeVariable': recipe.cycleTimeVariable.total_seconds(),  # Convert timedelta to seconds
            'productionRate': recipe.productionRate,
            'stdBatchSize': recipe.stdBatchSize
        }
        recipe_data.append(recipe_dict)

    return JsonResponse({'recipes': recipe_data})