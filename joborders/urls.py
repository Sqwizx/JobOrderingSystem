from django.urls import path
from joborders import views

urlpatterns = [
    path('create_joborder/', views.create_joborder, name='create_joborder'),
]