from django.urls import path
from users import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('search_jo/', views.search_view, name='search_view'),
    path('logout/', views.logout_view, name='logout'),

    #PRODUCTION DASHBOARD
    path('', views.dashboard_view, name='dashboard'),
    path('update_dashboard_table/', views.update_dashboard_table, name='updatetable'),

    # MANAGER DASHBOARD
    path('manager/', views.manager_dashboard_view, name='manager_dashboard'),
    path('update_manager_dashboard_table/', views.update_manager_dashboard_table, name='updatemanagertable'),

    # WORKER DASHBOARD
    path('dashboard/', views.worker_dashboard_view, name='worker_dashboard'),
    path('update_worker_dashboard_table/', views.update_worker_dashboard_table, name='updateworkertable'),

      #ARCHIVE JOB ORDER
    path('archives/', views.archives_view, name='archives'),
]