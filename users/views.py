import pytz
from users.models import UserRole
from django.utils import timezone
from recipes.models import Recipe
from django.contrib import messages
from joborders.models import JobOrder
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.http import Http404, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout

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
        else:
            # Check if the username exists in the database
            if User.objects.filter(username=username).exists():
                messages.error(request, "Your username/password is incorrect.")
            else:
                messages.error(request, "Your account does not exist.")

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

def search_view(request):
    query = request.GET.get('q', '')
    if query:
        job_orders = JobOrder.objects.filter(jobOrderId__icontains=query)
        results = [
            {
                'jobOrderId': job_order.jobOrderId,
                'jobOrderStatus': job_order.jobOrderStatus  # Include the job order status
            }
            for job_order in job_orders
        ]
        return JsonResponse(results, safe=False)
    return JsonResponse([])
        
def logout_view(request):
    logout(request)  # This logs the user out
    return redirect('login')  # Redirect to the 'login' URL pattern
    

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

    # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")
    
    for job_order in job_orders:
        # Initialize earliest_activity for each job order
        earliest_activity = {
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

        if job_order.jobOrderStatus == "ACTIVE":
            all_recipes_finished = True

            # Filter out recipes that are drafts
            non_draft_recipes = job_order.recipes.filter(isDraft=False)

            for recipe in non_draft_recipes:
                activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

                last_activity = recipe.activity_recipe.order_by('-cutOffTime').first()
                if last_activity and now < last_activity.cutOffTime:
                    all_recipes_finished = False

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
            
            if all_recipes_finished:
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

    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate

    # Restrict access to users with 'production' role
    if user_role != 'production':
        raise Http404("Page not found.")
    
    for job_order in job_orders:
        # Initialize earliest_activity for each job order
        earliest_activity = {
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

        if job_order.jobOrderStatus == "ACTIVE":
            all_recipes_finished = True

            # Filter out recipes that are drafts
            non_draft_recipes = job_order.recipes.filter(isDraft=False)

            for recipe in non_draft_recipes:
                activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

                last_activity = recipe.activity_recipe.order_by('-cutOffTime').first()
                if last_activity and now < last_activity.cutOffTime:
                    all_recipes_finished = False

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
            
            if all_recipes_finished:
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

    return JsonResponse({'job_orders': job_orders_list})

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

 # Restrict access to users with 'production' role
    if user_role != 'manager':
        raise Http404("Page not found.")

    for job_order in job_orders:
        # Initialize earliest_activity for each job order
        earliest_activity = {
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

        if job_order.jobOrderStatus == "ACTIVE":
            all_recipes_finished = True

            # Filter out recipes that are drafts
            non_draft_recipes = job_order.recipes.filter(isDraft=False)

            for recipe in non_draft_recipes:
                activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

                last_activity = recipe.activity_recipe.order_by('-cutOffTime').first()
                if last_activity and now < last_activity.cutOffTime:
                    all_recipes_finished = False

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
            
            if all_recipes_finished:
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
        'job_orders': job_orders_list,
        'user_role': user_role,
    }

    return render(request, 'manager_dashboard.html', context)


@login_required
def update_manager_dashboard_table(request):
    malaysian_tz = pytz.timezone('Asia/Kuala_Lumpur')
    now = timezone.now().astimezone(malaysian_tz)
    job_orders_list = []

    job_orders = JobOrder.objects.filter(
    jobOrderStatus__in=['PENDING', 'APPROVED', 'REVISE', 'ACTIVE']
).prefetch_related('recipes__activity_recipe')

    for job_order in job_orders:
        # Initialize earliest_activity for each job order
        earliest_activity = {
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

        if job_order.jobOrderStatus == "ACTIVE":
            all_recipes_finished = True

            # Filter out recipes that are drafts
            non_draft_recipes = job_order.recipes.filter(isDraft=False)

            for recipe in non_draft_recipes:
                activities = recipe.activity_recipe.order_by('spongeStart', 'doughStart').all()

                last_activity = recipe.activity_recipe.order_by('-cutOffTime').first()
                if last_activity and now < last_activity.cutOffTime:
                    all_recipes_finished = False

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
            
            if all_recipes_finished:
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

    return JsonResponse({'job_orders': job_orders_list})

@login_required
def worker_dashboard_view(request):
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
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

                # Filter out recipes that are drafts
        non_draft_recipes = job_order.recipes.filter(isDraft=False)

        for recipe in non_draft_recipes:
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
            'recipeName': 'None',
            'name': 'Not Started',
            'time': None
        }

                # Filter out recipes that are drafts
        non_draft_recipes = job_order.recipes.filter(isDraft=False)

        for recipe in non_draft_recipes:
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

    return JsonResponse({'job_orders': job_orders_list})

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

#ARCHIVE JOB ORDER
def archives_view(request):
    archived_job_orders_list = []

    # Fetch only archived job orders
    archived_job_orders = JobOrder.objects.filter(jobOrderStatus="ARCHIVED")

    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        user_role = None  # Or set a default role if appropriate
        
    # Restrict access to users with 'production' role
    if user_role != 'production' and user_role != 'manager':
        raise Http404("Page not found.")

    for job_order in archived_job_orders:
        job_data = {
            'jobOrderId': job_order.jobOrderId,
            'jobOrderCreatedDate': job_order.jobOrderCreatedDate,
            'jobOrderStatus': job_order.jobOrderStatus,
        }
        archived_job_orders_list.append(job_data)

    context = {
        'job_orders': archived_job_orders_list,
        'user_role': user_role,
    }

    return render(request, 'archives.html', context)