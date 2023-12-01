from collections import defaultdict
from itertools import groupby
from operator import attrgetter
from django.http import JsonResponse
import pytz
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from joborders.models import JobOrder
from django.contrib.auth.decorators import login_required
from django import template
from datetime import timedelta

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
     
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')  # Redirect to the 'dashboard' URL pattern
    return render(request, 'login.html')

@login_required
def dashboard_view(request):
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

def job_order_detail(request, job_order_id):
    job_order = get_object_or_404(JobOrder, jobOrderId=job_order_id)
    recipes = job_order.recipes.order_by('recipeProdDate')

    # Group recipes by their production date
    grouped_recipes = defaultdict(list)
    for recipe in recipes:
        grouped_recipes[recipe.recipeProdDate].append(recipe)

    # Assuming there are recipes, get the range of recipeProdDates
    date_range = grouped_recipes.keys()

    return render(request, 'view_joborder.html', {
        'job_order': job_order,
        'grouped_recipes': grouped_recipes,
        'date_range': date_range,
    })

def logout_view(request):
    logout(request)  # This logs the user out
    return redirect('login')  # Redirect to the 'login' URL pattern