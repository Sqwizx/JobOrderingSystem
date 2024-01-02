from django.urls import path
from users import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('', views.dashboard_view, name='dashboard'),
    path('update_dashboard_table/', views.update_dashboard_table, name='updatetable'),
    path('update_manager_dashboard_table/', views.update_manager_dashboard_table, name='updatemanagertable'),
    path('packaging/<str:job_order_id>/', views.job_order_recipes, name='packaging_details'),
    path('mixing/<str:job_order_id>/', views.job_order_recipes, name='mixing_details'),
    path('details/<str:job_order_id>/', views.job_order_recipes, name='details'),
    path('submit/<str:job_order_id>/', views.submit_job_order, name='details'),
    path('delete/<str:job_order_id>/', views.delete_job_order, name='delete_job_order'),
    path('edit/<str:job_order_id>/', views.edit_joborder, name='edit_job_order'),
    path('delete_recipe/<str:recipe_id>/', views.delete_recipe, name='delete_recipe'),
    path('add_product/', views.add_product, name='add_product'),
    path('add_recipe/<str:job_order_id>/', views.add_recipe, name='add_recipe'),
    path('delete_product/<str:product_id>/', views.delete_product, name='delete_product'),
    path('update_product/<str:product_id>/', views.update_product, name='update_product'),
    path('update/<str:job_order_id>/', views.submitJobOrder, name='submit_job_order'),
    path('activate/<str:job_order_id>/', views.activate_job_order, name='activate_job_order'),
    path('archive/<str:job_order_id>/', views.archive_job_order, name='archive_job_order'),
    path('deactivate/<str:job_order_id>/', views.deactivate_job_order, name='deactivate_job_order'),
    path('product/<str:product_id>/', views.get_product_details, name='product_details'),

    path('manager/', views.manager_dashboard_view, name='manager_dashboard'),
    path('approve/<str:job_order_id>/', views.approve_job_order, name='approve_job_order'),
    path('add_revision/<str:job_order_id>/', views.add_revision, name='add_revision'),

    path('archives/', views.archives_view, name='archives'),

    path('dashboard/', views.worker_dashboard, name='worker_dashboard'),
    path('update_worker_dashboard_table/', views.update_worker_dashboard_table, name='updateworkertable'),
    path('recipe/<str:recipe_id>/', views.get_recipe_details, name='recipe_details'),

    path('logout/', views.logout_view, name='logout'),
]