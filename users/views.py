from collections import defaultdict
from datetime import datetime, timedelta
from itertools import groupby
from django.db.models import Sum, Max
import json
from django.http import JsonResponse
from django.urls import reverse
import pytz
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from joborders.models import Activity, JobOrder, Product, RecipeMapping, Revision
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.core.serializers.json import DjangoJSONEncoder

from recipes.models import Recipe
from users.models import UserRole

def login_view(request):
    if request.user.is_authenticated:
        # Redirect to role-specific dashboard if already logged in
        return redirect_dashboard(request.user)

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            # Redirect to role-specific dashboard after login
            return redirect_dashboard(user)

    return render(request, 'login.html')

def redirect_dashboard(user):
    # Check the user's role and redirect accordingly
    try:
        user_role = UserRole.objects.get(user=user)
        if user_role.role == UserRole.MANAGER:
            return redirect('manager_dashboard')
        elif user_role.role in [UserRole.MIXING, UserRole.PACKAGING]:
            return redirect('worker_dashboard')
        else:
            return redirect('dashboard')
    except UserRole.DoesNotExist:
        # Default redirect if user role is not set
        return redirect('dashboard')


@login_required
def manager_dashboard_view(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.filter(
    jobOrderStatus__in=['PENDING', 'APPROVED', 'REVISE', 'ACTIVE']
).prefetch_related('recipes__activity_recipe')
    
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''
            
        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time': earliest_activity['time'],
        }

        # Append the job data to the job orders list
        job_orders_list.append(job_data)

    context = {
        'job_orders': job_orders_list,
        'user_role': user_role,
    }

    return render(request, 'manager_dashboard.html', context)

@login_required
def worker_dashboard(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.filter(
    jobOrderStatus__in=['ACTIVE']
).prefetch_related('recipes__activity_recipe')
    
    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''
            
        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time': earliest_activity['time'],
        }

        # Append the job data to the job orders list
        job_orders_list.append(job_data)

    context = {
        'job_orders': job_orders_list,
        'user_role': user_role,
    }

    return render(request, 'worker_dashboard.html', context)

@login_required
def update_worker_dashboard_table(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.filter(
    jobOrderStatus__in=['ACTIVE']
).prefetch_related('recipes__activity_recipe')

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''
            
        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time': earliest_activity['time'],
        }

        # Append the job data to the job orders list
        job_orders_list.append(job_data)

    context = {
        'job_orders': job_orders_list
    }

    return JsonResponse({'job_orders': job_orders_list})

@login_required
def dashboard_view(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.all().prefetch_related('recipes__activity_recipe')

    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''

        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time': earliest_activity['time'],
        }

        # Append the job data to the job orders list
        job_orders_list.append(job_data)

    context = {
        'job_orders': job_orders_list,
        'user_role': user_role,
    }

    return render(request, 'dashboard.html', context)

@login_required
def update_dashboard_table(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.all().prefetch_related('recipes__activity_recipe')

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        
        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''

        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time':  earliest_activity['time'],
        }

       # Append the job data to the job orders list
        job_orders_list.append(job_data)

    return JsonResponse({'job_orders': job_orders_list})

@login_required
def update_manager_dashboard_table(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.filter(
    jobOrderStatus__in=['PENDING', 'APPROVED', 'REVISE', 'ACTIVE']
).prefetch_related('recipes__activity_recipe')

    for job_order in job_orders:
        # Initialize the variables to store the earliest upcoming or ongoing activity
        earliest_activity = {
            'recipeName': None,
            'name': 'Not Started',
            'time': None
        }

        for recipe in job_order.recipes.all():
            activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

            for activity in activities:
                if now < activity.spongeStart:
                    if earliest_activity['time'] is None or activity.spongeStart < earliest_activity['time']:
                        earliest_activity['recipeName'] = recipe.recipeName
                        earliest_activity['name'] = 'Starting Sponge'
                        earliest_activity['time'] = activity.spongeStart

                elif activity.spongeStart <= now <= activity.spongeEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Sponge Ending'
                    earliest_activity['time'] = activity.spongeEnd
                    break

                elif activity.spongeEnd <= now <= activity.doughStart:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Starting Dough'
                    earliest_activity['time'] = activity.doughStart
                    break

                elif activity.doughStart <= now <= activity.doughEnd:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Dough Ending'
                    earliest_activity['time'] = activity.doughEnd
                    break

                elif activity.doughEnd <= now <= activity.firstLoafPacked:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'First Loaf Packing'
                    earliest_activity['time'] = activity.firstLoafPacked
                    break

                elif activity.firstLoafPacked <= now < activity.cutOffTime:
                    earliest_activity['recipeName'] = recipe.recipeName
                    earliest_activity['name'] = 'Cut Off Time'
                    earliest_activity['time'] = activity.cutOffTime
                    break

                elif now >= activity.cutOffTime:
                    earliest_activity['recipeName'] = 'All'
                    earliest_activity['name'] = 'Finished'
                    earliest_activity['time'] = None

        if job_order.jobOrderStatus != "ACTIVE":
            earliest_activity['recipeName'] = ''
            earliest_activity['name'] = ''
            earliest_activity['time'] = ''

        # Construct the job order data with the current activity information
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
            'current_recipe_name': earliest_activity['recipeName'],
            'current_activity_name': earliest_activity['name'],
            'current_activity_time':  earliest_activity['time'],
        }

       # Append the job data to the job orders list
        job_orders_list.append(job_data)

    return JsonResponse({'job_orders': job_orders_list})

def job_order_recipes(request, job_order_id):
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


def submit_job_order(request, job_order_id):
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

    
def approve_job_order(request, job_order_id):
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

def delete_job_order(request, job_order_id):
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

    # Prepare context
    context = {
        'job_order': job_order,
        'recipes_by_date': recipes_by_date,
        'sorted_dates': sorted_dates,
        'user_role': user_role,
    }

    return render(request, 'edit_joborder.html', context)

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

def delete_recipe_if_draft(request, recipe_id):
    try:
        recipe = RecipeMapping.objects.get(id=recipe_id)
        if recipe.isDraft and not recipe.products.exists():
            recipe.delete()
            return JsonResponse({"message": "Draft recipe deleted"})
    except RecipeMapping.DoesNotExist:
        pass

    return JsonResponse({"message": "No action taken"})

def submitJobOrder(request, job_order_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            job_order = JobOrder.objects.get(jobOrderId=job_order_id)

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

                # # Calculate totalTray and totalTrolley
                # total_tray = sum([int(prod_data.get('tray')) for prod_data in recipe_data.get('products', [])])
                # total_trolley = sum([int(prod_data.get('trolley')) for prod_data in recipe_data.get('products', [])])
                # recipe.recipeTotalTray = total_tray
                # recipe.recipeTotalTrolley = total_trolley

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

def delete_recipe(request, recipe_id):
    if request.method == "DELETE":
        try:
            recipe = RecipeMapping.objects.get(recipeId=recipe_id)
            recipe.delete()
            return JsonResponse({"message": "Recipe deleted successfully"})
        except RecipeMapping.DoesNotExist:
            return JsonResponse({"error": "Recipe not found"}, status=404)

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

def activate_job_order(request, job_order_id):
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
        job_order.jobOrderStatus = 'ACTIVE'
        job_order.save()
        return JsonResponse({'status': 'success', 'message': 'Job Order activated successfully'})
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
def archive_job_order(request, job_order_id):
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

def deactivate_job_order(request, job_order_id):
    try:
        job_order = JobOrder.objects.get(jobOrderId=job_order_id)
        job_order.jobOrderStatus = 'APPROVED'
        job_order.save()
        return JsonResponse({'status': 'success', 'message': 'Job Order deactivated successfully'})
    except JobOrder.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Job Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


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

def search_recipes(request):
    query = request.GET.get('query', '')
    recipes = Recipe.objects.filter(recipeName__icontains=query)

    # Prepare the data for JSON response
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

def archives_view(request):
    archived_job_orders_list = []

    # Fetch only archived job orders
    archived_job_orders = JobOrder.objects.filter(jobOrderStatus="ARCHIVED")

    for job_order in archived_job_orders:
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
        }
        archived_job_orders_list.append(job_data)

    context = {
        'job_orders': archived_job_orders_list
    }

    return render(request, 'archives.html', context)

def get_product_details(request, product_id):
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

def get_recipe_details(request, recipe_id):
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
        
def logout_view(request):
    logout(request)  # This logs the user out
    return redirect('login')  # Redirect to the 'login' URL pattern
    