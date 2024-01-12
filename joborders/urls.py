from django.urls import path
from joborders import views

urlpatterns = [
    # COMMON FUNCTIONS
    path('search/', views.search_recipes, name='search_recipes'),

    # PRODUCTION
    # VIEW JOB ORDER
    path('packaging/<str:job_order_id>/', views.view_joborder, name='packaging_details'),
    path('mixing/<str:job_order_id>/', views.view_joborder, name='mixing_details'),
    path('details/<str:job_order_id>/', views.view_joborder, name='details'),
    path('submit/<str:job_order_id>/', views.submit_joborder, name='submitbutton'),
    path('delete/<str:job_order_id>/', views.delete_joborder, name='deletebutton'),
    path('edit/<str:job_order_id>/', views.edit_joborder, name='editbutton'),
    path('activate/<str:job_order_id>/', views.activate_joborder, name='activatebutton'),
    path('deactivate/<str:job_order_id>/', views.deactivate_joborder, name='deactivatebutton'),
    path('archive/<str:job_order_id>/', views.archive_joborder, name='archive_job_order'),
    path('product/<str:product_id>/', views.get_product_details, name='product_details'),

    # EDIT JOB ORDER - PRODUCTS
    path('add_product/', views.add_product, name='add_product'),
    path('delete_product/<str:product_id>/', views.delete_product, name='delete_product'),
    path('update_product/<str:product_id>/', views.update_product, name='update_product'),
    
    # EDIT JOB ORDER - RECIPES
    path('add_recipe/<str:job_order_id>/', views.add_recipe, name='add_recipe'),    
    path('delete_recipe/<str:recipe_id>/', views.delete_recipe, name='delete_recipe'),
    path('draft/<str:recipe_id>/', views.delete_recipedraft, name='draft_recipe'),
    path('update/<str:job_order_id>/', views.update_joborder, name='update_joborder'),
  
    # CREATE JOB ORDER
    path('create_breadline/', views.create_breadline, name='create_breadline'),
    path('save_recipes/', views.save_recipes, name='save_recipes'),
    path('create_wrapline/', views.create_wrapline, name='create_wrapline'),

    # MANAGER
    path('approve/<str:job_order_id>/', views.approve_joborder, name='approve_job_order'),
    path('add_revision/<str:job_order_id>/', views.add_revision, name='add_revision'),

    #WORKER (PACKAGING)
    path('recipe/<str:recipe_id>/', views.get_recipe_details, name='recipe_details'),


]