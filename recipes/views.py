from django.contrib.auth.decorators import login_required
from django.http import Http404, JsonResponse
from django.shortcuts import render, redirect

from users.models import UserRole
from .models import Recipe
from django.views.decorators.http import require_POST
from datetime import timedelta

@login_required
def recipe_dashboard(request):
    recipes = Recipe.objects.all()
    user_role = None

    try:
        user_role = UserRole.objects.get(user=request.user).role
    except UserRole.DoesNotExist:
        # Handle the case where the user role is not set
        pass

     # Restrict access to users with 'production' role
    if user_role != 'production' and user_role != 'manager':
        raise Http404("Page not found.")
    
    context = {
        'recipes': recipes,
        'user_role': user_role,
    }

    return render(request, 'recipe_dashboard.html', context)


@require_POST
def create_recipe(request):
    if request.method == 'POST':
        recipe_name = request.POST['recipeName']
        production_rate = request.POST['productionRate']
        std_batch_size = request.POST['stdBatchSize']
        cycle_time_variable_str = request.POST['cycleTimeVariable']

        try:
            hours, minutes, seconds = map(int, cycle_time_variable_str.split(':'))
            cycleTimeVariable = timedelta(hours=hours, minutes=minutes, seconds=seconds)
        except ValueError:
            return render(request, 'recipe_dashboard.html', {'error_message': 'Invalid cycleTimeVariable format'})

        recipe = Recipe(
            recipeName=recipe_name,
            productionRate=production_rate,
            stdBatchSize=std_batch_size,
            cycleTimeVariable=cycleTimeVariable,
        )
        recipe.save()

        return redirect('recipe_dashboard')

    return render(request, 'recipe_dashboard.html')

from django.shortcuts import render, redirect
from django.contrib import messages

@require_POST
def update_recipe(request):
    if request.method == 'POST':
        recipe_name = request.POST['recipeName']
        production_rate = request.POST['productionRate']
        std_batch_size = request.POST['stdBatchSize']
        cycle_time_variable_str = request.POST['cycleTimeVariable']

        try:
            hours, minutes, seconds = map(int, cycle_time_variable_str.split(':'))
            cycleTimeVariable = timedelta(hours=hours, minutes=minutes, seconds=seconds)
        except ValueError:
            messages.error(request, 'Invalid cycleTimeVariable format')
            return redirect('recipe_dashboard')  # Redirect with an error message

        # Update the recipe information in the database
        recipe_id = request.POST['recipeId']  # Make sure to add an input field for recipeId in the form
        recipe = Recipe.objects.get(pk=recipe_id)
        recipe.recipeName = recipe_name
        recipe.productionRate = production_rate
        recipe.stdBatchSize = std_batch_size
        recipe.cycleTimeVariable = cycleTimeVariable
        recipe.save()

        messages.success(request, 'Recipe updated successfully')
        return redirect('recipe_dashboard')  # Redirect with a success message

    return render(request, 'recipe_dashboard.html')

@require_POST
def delete_recipe(request):
    if request.method == 'POST':
        recipe_id = request.POST['recipeId']   # Get the recipe ID from the POST request

        try:
            recipe = Recipe.objects.get(pk=recipe_id)

            # You can add permission checks here if needed

            recipe.delete()  # Delete the recipe
            return JsonResponse({'success': True, 'message': 'Recipe deleted successfully'})
        except Recipe.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Recipe not found'})

    return JsonResponse({'success': False, 'message': 'Invalid request'})