from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout

from django.contrib.auth.decorators import login_required

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
     
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')  # Redirect to the 'dashboard' URL pattern
    return render(request, 'login.html')

@login_required
def dashboard_view(request):
    # Add authentication check here if necessary
    return render(request, 'dashboard.html')

def logout_view(request):
    logout(request)  # This logs the user out
    return redirect('login')  # Redirect to the 'login' URL pattern