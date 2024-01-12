import pytz
import json
from decimal import Decimal
from itertools import groupby
from django.urls import reverse
from django.db.models import Sum
from django.utils import timezone
from users.models import UserRole
from django.db import transaction
from recipes.models import Recipe
from collections import defaultdict
from datetime import datetime, timedelta
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from .models import RecipeMapping, JobOrder, Activity, Product, Revision

#COMMON FUNCTIONS
def search_recipes(request):
    query = request.GET.get('query', '')
    recipes = Recipe.objects.filter(recipeName__icontains=query)

    recipe_data = []
    for recipe in recipes:
        recipe_dict = {
            'recipeName': recipe.recipeName,
            'cycleTimeVariable': recipe.cycleTimeVariable.total_seconds(),  # Convert timedelta to seconds
            'productionRate': recipe.productionRate,
            'stdBatchSize': recipe.stdBatchSize
        }
        recipe_data.append(recipe_dict)

    return JsonResponse({'recipes': recipe_data})

#PRODUCTION
#VIEW JOB ORDER FUNCTIONS
def view_joborder(request, job_order_id):
    job_order = JobOrder.objects.get(jobOrderId=job_order_id)
    recipes = RecipeMapping.objects.filter(jobOrder=job_order)

    recipes_by_date = defaultdict(list)
    for recipe in recipes:
        recipes_by_date[recipe.recipeProdDate].append(recipe)
    sorted_dates = sorted(recipes_by_date.keys())

    revisions = Revision.objects.filter(jobOrder=job_order).order_by('-dateTime')

    # Check if there are any unamended revisions for this job order
    new_revisions = Revision.objects.filter(jobOrder=job_order, ammended=False).exists()

    # Group revisions by date
    grouped_revisions = {}
    for date, group in groupby(revisions, key=lambda x: x.dateTime.date()):
        grouped_revisions[date] = list(group)

    # Get the role of the current user
    template_name = 'view_joborder.html'  # Default template
    try:
        user_role = UserRole.objects.get(user=request.user).role
        if user_role == UserRole.MIXING:
            template_name = 'mixing_view.html'  # Template for MIXING role
        elif user_role == UserRole.PACKAGING:
            template_name = 'packaging_view.html'  # Template for PACKAGING role
    except UserRole.DoesNotExist:
        user_role = None

    revisions_count = Revision.objects.filter(jobOrder=job_order, ammended=False).count()

    context = {
        'job_order': job_order,
        'recipes_by_date': recipes_by_date,
        'sorted_dates': sorted_dates,
        'user_role': user_role,
        'grouped_revisions': grouped_revisions,
        'new_revisions': new_revisions,
        'revisions_count': revisions_count,
    }

    return render(request, template_name, context)

#VIEW JOB ORDER BUTTON FUNCTIONS
@login_required
def submit_joborder(request, job_order_id):
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

 # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")
    
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)

    if job_order.jobOrderStatus not in ['DRAFT', 'REVISE']:
        return JsonResponse({'status': 'error', 'message': 'Job Order status is not DRAFT or REVISE'}, status=400)

    try:
        with transaction.atomic():
            # Check if the job order is in 'REVISE' status, then update revisions
            if job_order.jobOrderStatus == 'REVISE':
                revisions = Revision.objects.filter(jobOrder=job_order)
                if revisions.exists():
                    revisions.update(ammended=True)

            # Update the job order status to "PENDING"
            job_order.jobOrderStatus = 'PENDING'
            job_order.save()

            # Return success status
            return JsonResponse({'status': 'success', 'message': 'Job Order submitted successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def delete_joborder(request, job_order_id):
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

 # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")

    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)

    try:
        with transaction.atomic():
            # Delete related tables (e.g., recipes, activities, products)
            job_order.recipes.all().delete()
            job_order.delete()

            # Redirect to dashboard.html
            return JsonResponse({'status': 'success', 'redirect': reverse('dashboard')})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def edit_joborder(request, job_order_id):
    
    # Get the specific Job Order or return a 404 if not found
    job_order = get_object_or_404(JobOrder, jobOrderId=job_order_id)

    # Set job order status to 'DRAFT' and save
    job_order.jobOrderStatus = 'DRAFT'
    job_order.save()

    # Fetch recipes associated with the Job Order
    recipes = RecipeMapping.objects.filter(jobOrder=job_order)

    # Group recipes by production date
    recipes_by_date = defaultdict(list)
    for recipe in recipes:
        recipes_by_date[recipe.recipeProdDate].append(recipe)

    # Sort the dates
    sorted_dates = sorted(recipes_by_date.keys())


    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

    # Restrict access to users with 'production' role
    if user_role != 'production' and user_role != 'manager':
        raise Http404("Page not found.")
    # Prepare context
    context = {
        'job_order': job_order,
        'recipes_by_date': recipes_by_date,
        'sorted_dates': sorted_dates,
        'user_role': user_role,
    }

    return render(request, 'edit_joborder.html', context)

def activate_joborder(job_order_id):
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
        job_order.jobOrderStatus = 'ACTIVE'
        job_order.save()
        return JsonResponse({'status': 'success', 'message': 'Job Order activated successfully'})
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def deactivate_joborder(request, job_order_id):
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
        job_order.jobOrderStatus = 'APPROVED'
        job_order.save()
        return JsonResponse({'status': 'success', 'message': 'Job Order deactivated successfully'})
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def archive_joborder(request, job_order_id):
    if request.method == 'POST':
        try:
            job_order = JobOrder.objects.get(jobOrderId=job_order_id)
            # Update the job order status to 'ARCHIVED'
            job_order.jobOrderStatus = 'ARCHIVED'
            job_order.save()

            return JsonResponse({'status': 'success', 'message': 'Job Order archived successfully'})
        except JobOrder.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

def get_product_details(product_id):
    try:
        product = Product.objects.get(productId=product_id)
        product_data = {
            'productName': product.productName,
            'productSalesOrder': product.productSalesOrder,
            'currency': product.currency,
            'productPrice': product.productPrice,
            'client': product.client,
            'colorSet': product.colorSet,
            'productExpDate': product.productExpDate.strftime("%Y-%m-%d") if product.productExpDate else '',
            'productSaleDate': product.productSaleDate.strftime("%Y-%m-%d") if product.productSaleDate else '',
            'weight': product.weight,
            'noOfSlices': product.noOfSlices,
            'thickness': product.thickness,
            'tray': product.tray,
            'trolley': product.trolley,
            'productRemarks': product.productRemarks
        }
        return JsonResponse(product_data, safe=False, encoder=DjangoJSONEncoder)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

#EDIT JOB ORDER FUNCTIONS - PRODUCTS
def add_product(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            recipe = RecipeMapping.objects.get(recipeId=data["recipeId"])

            # Convert productSalesOrder to integer
            product_sales_order = int(data.get("productSalesOrder", 0))

            # Generate productId
            productId = "{}_{}".format(data["recipeId"], data["productName"])

            # Create the new product
            Product.objects.create(
                productId=productId,
                productName=data["productName"],
                productSalesOrder=product_sales_order,
                currency=data["currency"],
                productPrice=data["productPrice"],
                client=data["client"],
                colorSet=data["colorSet"],
                productExpDate=data.get("expiryDate", None),
                productSaleDate=data.get("saleDate", None),
                weight=data["weight"],
                noOfSlices=data["noOfSlices"],
                thickness=data["thickness"],
                tray=data["tray"],
                trolley=data["trolley"],
                productRemarks=data["productRemarks"],
                recipe=recipe
            )

            # Recalculate totals for the recipe
            total_tray = recipe.products.aggregate(total_tray=Sum('tray'))['total_tray'] or 0
            total_trolley = recipe.products.aggregate(total_trolley=Sum('trolley'))['total_trolley'] or 0

            # Update recipe total sales, tray, and trolley
            recipe.recipeTotalSales = (recipe.recipeTotalSales or 0) + product_sales_order
            recipe.recipeTotalTray = total_tray
            recipe.recipeTotalTrolley = total_trolley
            recipe.save()

            return JsonResponse({"message": "New product added successfully"})

        except ObjectDoesNotExist:
            return JsonResponse({"error": "Recipe not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

def delete_product(request, product_id):
    if request.method == "DELETE":
        try:
            product = Product.objects.get(productId=product_id)
            recipe = product.recipe

            tray_removed = product.tray
            trolley_removed = product.trolley
            sales_order_removed = product.productSalesOrder

            # Subtract product's tray and trolley from the recipe's totals
            recipe.recipeTotalTray = max((recipe.recipeTotalTray or 0) - tray_removed, 0)
            recipe.recipeTotalTrolley = max((recipe.recipeTotalTrolley or 0) - trolley_removed, 0)
            
            # Subtract product's sales order from the recipe's total sales
            recipe.recipeTotalSales = max((recipe.recipeTotalSales or 0) - sales_order_removed, 0)
            recipe.save()

            # Now delete the product
            product.delete()
            return JsonResponse({
                "message": "Product deleted successfully",
                "trayRemoved": tray_removed,
                "trolleyRemoved": trolley_removed,
                "salesOrderRemoved": sales_order_removed
            })
        except Product.DoesNotExist:
            return JsonResponse({"error": "Product not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

def update_product(request, product_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            product = Product.objects.get(productId=product_id)
            recipe = product.recipe

            # Convert the sales order values to integers
            new_sales_order = int(data.get("productSalesOrder", 0))
            old_sales_order = int(product.productSalesOrder or 0)

            # Calculate the difference in sales order
            sales_order_difference = new_sales_order - old_sales_order

            # Update the fields of the existing product
            product.productName = data.get("productName", product.productName)
            product.productSalesOrder = data.get("productSalesOrder", product.productSalesOrder)
            product.currency = data.get("currency", product.currency)
            product.productPrice = data.get("productPrice", product.productPrice)
            product.client = data.get("client", product.client)
            product.colorSet = data.get("colorSet", product.colorSet)
            product.productExpDate = data.get("productExpDate", product.productExpDate)
            product.productSaleDate = data.get("productSaleDate", product.productSaleDate)
            product.weight = data.get("weight", product.weight)
            product.noOfSlices = data.get("noOfSlices", product.noOfSlices)
            product.thickness = data.get("thickness", product.thickness)
            product.tray = data.get("tray", product.tray)
            product.trolley = data.get("trolley", product.trolley)
            product.productRemarks = data.get("productRemarks", product.productRemarks)

            # Save the updated product
            product.save()

            # Update recipeTotalSales with the difference
            recipe.recipeTotalSales = (recipe.recipeTotalSales or 0) + sales_order_difference
            recipe.save()

            # Update total tray and total trolley
            total_tray = recipe.products.aggregate(total_tray=Sum('tray'))['total_tray'] or 0
            total_trolley = recipe.products.aggregate(total_trolley=Sum('trolley'))['total_trolley'] or 0
            recipe.recipeTotalTray = total_tray
            recipe.recipeTotalTrolley = total_trolley
            recipe.save()

            return JsonResponse({"message": "Product updated successfully"})

        except ObjectDoesNotExist:
            return JsonResponse({"error": "Product not found"}, status=404)
        except KeyError as e:
            return JsonResponse({"error": f"Missing field: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

#EDIT JOB ORDER FUNCTIONS - RECIPES
def add_recipe(request, job_order_id):
    if request.method == "POST":
        data = json.loads(request.body)
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)

        recipe_name = data["recipeName"]
        tab_index = data["tabIndex"]
        prod_rate = data["prodRate"]
        batch_size = data["batchSize"]
        cycle_time = data["cycleTime"]
        recipe_id = f"{job_order_id}_{recipe_name}_{tab_index}"
        prod_date = datetime.strptime(data["prodDate"], "%Y-%m-%d").date()
        time_parts = map(int, data.get("timeVariable", "00:00:00").split(':'))
        time_variable = timedelta(hours=next(time_parts, 0), minutes=next(time_parts, 0), seconds=next(time_parts, 0))

        if "cycleTime" in data and data["cycleTime"]:
            cycle_time_parts = map(int, data["cycleTime"].split(':'))
            cycle_time = timedelta(hours=next(cycle_time_parts, 0), minutes=next(cycle_time_parts, 0), seconds=next(cycle_time_parts, 0))
        else:
            cycle_time = None  # Or set a default value

        # Get the last spongeEndTime for the same date
        last_sponge_end = Activity.objects.filter(
            recipe__recipeProdDate=prod_date
        ).order_by('-spongeEnd').values_list('spongeEnd', flat=True).first()

        existing_recipe = RecipeMapping.objects.filter(
                    recipeProdDate=prod_date
                ).order_by('-id').first()
        
        gap_value = existing_recipe.recipeGap if existing_recipe else 0

        # Calculate new spongeStartTime
        new_sponge_start = last_sponge_end + timedelta(minutes=45) if last_sponge_end else None

        # Create the new recipe
        recipe = RecipeMapping.objects.create(
            jobOrder=job_order,
            recipeId=recipe_id,
            recipeName=recipe_name,
            recipeProdDate=prod_date,
            recipeTimeVar=time_variable,
            recipeCycleTime=cycle_time,
            recipeProdRate = None if not prod_rate else prod_rate,
            recipeBatchSize = None if not batch_size else batch_size,
            recipeWaste=2,
            recipeGap=gap_value,
            isDraft=True,
            recipeSpongeStartTime=new_sponge_start,
        )

        # Create the associated Activity
        Activity.objects.create(
            recipe=recipe,
            spongeStart=new_sponge_start,
            spongeEnd=None,
            doughStart=None,
            doughEnd=None,
            firstLoafPacked=None,
            cutOffTime=None,
            # Other fields set to None or default values
        )

        return JsonResponse({"message": "Recipe added successfully", "recipe_id": recipe.id})

    return JsonResponse({"message": "Invalid request"}, status=400)

def delete_recipe(request, recipe_id):
    if request.method == "DELETE":
        try:
            recipe = RecipeMapping.objects.get(recipeId=recipe_id)
            recipe.delete()
            return JsonResponse({"message": "Recipe deleted successfully"})
        except RecipeMapping.DoesNotExist:
            return JsonResponse({"error": "Recipe not found"}, status=404)

def delete_recipedraft(recipe_id):
    try:
        recipe = RecipeMapping.objects.get(id=recipe_id)
        if recipe.isDraft and not recipe.products.exists():
            recipe.delete()
            return JsonResponse({"message": "Draft recipe deleted"})
    except RecipeMapping.DoesNotExist:
        pass

    return JsonResponse({"message": "No action taken"})

def update_joborder(request, job_order_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            JobOrder.objects.get(jobOrderId=job_order_id)

            for recipe_data in data.get('recipes', []):
                recipe_id = recipe_data['recipeId']
                recipe = RecipeMapping.objects.get(recipeId=recipe_id)
                # Update recipe fields
                recipe.recipeProdRate = recipe_data.get('prodRate', recipe.recipeProdRate)
                recipe.recipeBatchSize = recipe_data.get('batchSize', recipe.recipeBatchSize)
                recipe.recipeTotalSales = recipe_data.get('totalSales', recipe.recipeTotalSales)
                recipe.recipeBatches = recipe_data.get('batches', recipe.recipeBatches)
                recipe.recipeWaste = recipe_data.get('waste', recipe.recipeWaste)
                recipe.recipeBeltNo = recipe_data.get('beltNo', recipe.recipeBeltNo)
                recipe.recipeGap = recipe_data.get('gap', recipe.recipeGap)
                recipe.recipeTotalTray = recipe_data.get('totalTray', recipe.recipeTotalTray)
                recipe.recipeTotalTrolley = recipe_data.get('totalTrolleyes', recipe.recipeTotalTrolley)
                recipe.recipeTimeVar = recipe_data.get('timeVariable', recipe.recipeTimeVar)

                # Parse stdTime and cycleTime
                std_hours, std_minutes, std_seconds = map(int, recipe_data.get('stdTime', '00:00:00').split(':'))
                std_time_delta = timedelta(hours=std_hours, minutes=std_minutes, seconds=std_seconds)
                recipe.recipeStdTime = std_time_delta

                cycle_hours, cycle_minutes, cycle_seconds = map(int, recipe_data.get('cycleTime', '00:00:00').split(':'))
                cycle_time_delta = timedelta(hours=cycle_hours, minutes=cycle_minutes, seconds=cycle_seconds)
                recipe.recipeCycleTime = cycle_time_delta

                gap_hours, gap_minutes, gap_seconds = map(int, recipe_data.get('gap', '00:00:00').split(':'))
                gap_time_delta = timedelta(hours=gap_hours, minutes=gap_minutes, seconds=gap_seconds)
                recipe.recipeGap = gap_time_delta

                timevar_hours, timevar_minutes, timevar_seconds = map(int, recipe_data.get('timeVariable', '00:00:00').split(':'))
                timevar_time_delta = timedelta(hours=timevar_hours, minutes=timevar_minutes, seconds=timevar_seconds)
                recipe.recipeTimeVar = timevar_time_delta

                # Parse and save spongeStartTime
                sponge_start_time_str = recipe_data.get('spongeStartTime', '')
                if sponge_start_time_str:
                    recipe.recipeSpongeStartTime = datetime.strptime(sponge_start_time_str, '%Y-%m-%d %H:%M')

                recipe.save()

                # Update activity
                activity_data = recipe_data.get('activity', {})
                activity, created = Activity.objects.get_or_create(recipe=recipe)
                activity.spongeStart = datetime.strptime(activity_data.get('spongeStart', ''), '%A, %d %b %Y %H:%M') if activity_data.get('spongeStart') else None
                activity.spongeEnd = datetime.strptime(activity_data.get('spongeEnd', ''), '%A, %d %b %Y %H:%M') if activity_data.get('spongeEnd') else None
                activity.doughStart = datetime.strptime(activity_data.get('doughStart', ''), '%A, %d %b %Y %H:%M') if activity_data.get('doughStart') else None
                activity.doughEnd = datetime.strptime(activity_data.get('doughEnd', ''), '%A, %d %b %Y %H:%M') if activity_data.get('doughEnd') else None
                activity.firstLoafPacked = datetime.strptime(activity_data.get('firstLoafPacked', ''), '%A, %d %b %Y %H:%M') if activity_data.get('firstLoafPacked') else None
                activity.cutOffTime = datetime.strptime(activity_data.get('cutOffTime', ''), '%A, %d %b %Y %H:%M') if activity_data.get('cutOffTime') else None
                activity.save()

            return JsonResponse({"message": "Job order and recipes updated successfully."})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"message": "Invalid request"}, status=400)

# CREATE JOB ORDER FUNCTIONS
@login_required
def create_breadline(request):
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

 # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")
    
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
        return render(request, 'create_breadline.html', {'date_info': date_info, 'current_date': current_date, 'user_role': user_role})

@login_required
def create_wrapline(request):
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate
    
     # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")

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
        return render(request, 'create_wrapline.html', {'date_info': date_info, 'current_date': current_date, 'user_role': user_role})

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
            # Parse the datetime strings into aware datetime objects
            recipe_prod_date = aware.localize(datetime.strptime(recipe_data['dateTimePicker'], '%A, %d %b %Y'))
            sponge_start = aware.localize(datetime.strptime(recipe_data['spongeStartTime'], '%A, %d %b %Y %H:%M'))
            sponge_end = aware.localize(datetime.strptime(recipe_data['spongeEndTime'], '%A, %d %b %Y %H:%M'))
            dough_start = aware.localize(datetime.strptime(recipe_data['doughStartTime'], '%A, %d %b %Y %H:%M'))
            dough_end = aware.localize(datetime.strptime(recipe_data['doughEndTime'], '%A, %d %b %Y %H:%M'))
            first_loaf_packed = aware.localize(datetime.strptime(recipe_data['firstLoafPacked'], '%A, %d %b %Y %H:%M'))
            cut_off = aware.localize(datetime.strptime(recipe_data['cutOffTime'], '%A, %d %b %Y %H:%M'))
            std_hours, std_minutes, std_seconds = map(int, recipe_data.get('stdTime', '00:00:00').split(':'))
            timevar_hours, timevar_minutes, timevar_seconds = map(int, recipe_data.get('stdTime', '00:00:00').split(':'))
            cycle_hours, cycle_minutes, cycle_seconds = map(int, recipe_data.get('cycleTime', '00:00:00').split(':'))
            gap_hours, gap_minutes, gap_seconds = map(int, recipe_data.get('gap', '00:00:00').split(':'))
                        

            # Create RecipeMapping instance
            timevar_time_delta = timedelta(hours=timevar_hours, minutes=timevar_minutes, seconds=timevar_seconds)
            std_time_delta = timedelta(hours=std_hours, minutes=std_minutes, seconds=std_seconds)
            cycle_time_delta = timedelta(hours=cycle_hours, minutes=cycle_minutes, seconds=cycle_seconds)
            gap_time_delta = timedelta(hours=gap_hours, minutes=gap_minutes, seconds=gap_seconds)
            recipe_id = '{}_{}_{}'.format(job_order_id, recipe_data['recipeName'], recipe_data['formId'].split('-')[1])
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
                recipeSpongeStartTime=sponge_start,
                recipeCycleTime=cycle_time_delta,
                recipeWaste=float(recipe_data.get('waste', 0)),
                recipeTotalTray=int(recipe_data.get('totalTray', 0)),
                recipeTotalTrolley=int(recipe_data.get('totalTrolley', 0)),
                recipeBeltNo=int(recipe_data.get('beltNo', 0)),
                recipeGap=gap_time_delta,
                recipeTimeVar=timevar_time_delta,
            )

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

# MANAGER FUNCTIONS
@login_required
def approve_joborder(request, job_order_id):
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

 # Restrict access to users with 'production' role
    if user_role != 'manager':
        raise Http404("Page not found.")
    
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)

    if job_order.jobOrderStatus != 'PENDING':
        return JsonResponse({'status': 'error', 'message': 'Job Order status is not PENDING'}, status=400)

    try:
        with transaction.atomic():
            # Update the status to "APPROVED"
            job_order.jobOrderStatus = 'APPROVED'
            job_order.save()

                        # Return success status
            return JsonResponse({'status': 'success', 'message': 'Job Order submitted successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def add_revision(request, job_order_id):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)

    if request.method == 'POST':
        user = request.user
        data = json.loads(request.body)
        revision_text = data.get('revisionText')

        try:
            job_order = JobOrder.objects.get(jobOrderId=job_order_id)
            
            # Update the job order's status to 'REVISE'
            job_order.jobOrderStatus = 'REVISE'
            job_order.save()

            # Create a new revision
            Revision.objects.create(
                dateTime=now,
                userId=user,
                jobOrder=job_order,
                revision=revision_text  # Make sure this field exists in your model
            )

            return JsonResponse({'status': 'success', 'message': 'Revision added successfully.'})
        except JobOrder.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Job Order not found.'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data.'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request.'})

#WORKER VIEW (PACKAGING)
def get_recipe_details(recipe_id):
    try:
        recipe = RecipeMapping.objects.get(recipeId=recipe_id)
        recipe_data = {
            'recipeId': recipe.recipeId,
            'recipeName': recipe.recipeName,
            'recipeProdDate': recipe.recipeProdDate.strftime("%Y-%m-%d"),
            'recipeProdRate': recipe.recipeProdRate,
            'recipeBatchSize': recipe.recipeBatchSize,
            'recipeTotalSales': recipe.recipeTotalSales,
            'recipeBatches': recipe.recipeBatches,
            'recipeStdTime': str(recipe.recipeStdTime),
            'recipeCycleTime': str(recipe.recipeCycleTime),
            'recipeWaste': float(recipe.recipeWaste) if recipe.recipeWaste else None,
            'recipeSpongeStartTime': recipe.recipeSpongeStartTime.strftime("%Y-%m-%d %H:%M:%S") if recipe.recipeSpongeStartTime else '',
            'recipeTotalTray': recipe.recipeTotalTray,
            'recipeTotalTrolley': recipe.recipeTotalTrolley,
            'recipeBeltNo': recipe.recipeBeltNo,
            'recipeGap': str(recipe.recipeGap),
        }
        return JsonResponse(recipe_data, safe=False)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Recipe not found'}, status=404)