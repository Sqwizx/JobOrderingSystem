from django.urls import path
from recipes import views

urlpatterns = [
    path('recipe_dashboard/', views.recipe_dashboard, name='recipe_dashboard'),
    path('create_recipe/', views.create_recipe, name='create_recipe'),
    path('update_recipe/', views.update_recipe, name='update_recipe'),
    path('delete_recipe/', views.delete_recipe, name='delete_recipe'),

    path('get_product/<str:recipe_id>/', views.get_product, name='get_products'),
    path('add_recipeproduct/', views.add_recipeproduct, name='add_product'),
]

