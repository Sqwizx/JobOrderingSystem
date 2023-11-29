from django.urls import path
from users import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('', views.dashboard_view, name='dashboard'),
    path('update_dashboard_table/', views.update_dashboard_table, name='updatetable'),
    path('logout/', views.logout_view, name='logout'),
]