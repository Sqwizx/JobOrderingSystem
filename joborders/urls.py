from django.urls import path
from joborders import views

urlpatterns = [
    path('create_breadline/', views.create_breadline, name='create_breadline'),
    path('save_recipes/', views.save_recipes, name='save_recipes'),
    path('search/', views.search_recipes, name='search_recipes'),
    path('create_wrapline/', views.create_wrapline, name='create_wrapline'),
]