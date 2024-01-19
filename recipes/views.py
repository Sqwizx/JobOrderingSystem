import json
from django.contrib.auth.decorators import login_required
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, render, redirect

from users.models import UserRole
from .models import Product, Recipe
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

def get_product(request, recipe_id):
    recipe = get_object_or_404(Recipe, recipeName=recipe_id)
    products = Product.objects.filter(recipe=recipe).values(
        'productName', 'currency', 'productPrice', 'client', 
        'weight', 'noOfSlices', 'thickness'
    )
    return JsonResponse(list(products), safe=False)

def add_recipeproduct(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            recipe_id = data.get('recipeId') 
            recipe = Recipe.objects.get(pk=recipe_id)
            product = Product.objects.create(
            productName=data.get('productName'),
            currency=data.get('currency'),
            productPrice=data.get('productPrice'),
            client=data.get('client'),
            weight=data.get('weight'),
            noOfSlices=data.get('noOfSlices'),
            thickness=data.get('thickness'),
            recipe=recipe
        )

            return JsonResponse({
        'status': 'success',
        'productName': product.productName,
        'currency': product.currency,
        'productPrice': product.productPrice,
        'currency': product.currency,
        'client': product.client,
        'weight': product.weight,
        'noOfSlices': product.noOfSlices,
        'thickness': product.thickness,
})

        except Recipe.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Recipe not found'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)