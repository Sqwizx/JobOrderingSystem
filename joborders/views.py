from datetime import datetime, timedelta
from django.shortcuts import render
from django.http import JsonResponse

from django.contrib.auth.decorators import login_required

@login_required
def create_joborder(request):
    if request.method == 'GET' and 'selected_date' in request.GET:
        selected_date = request.GET.get('selected_date')
        current_date = datetime.strptime(selected_date, '%Y-%m-%d')
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        date_info = [{'date': (current_date + timedelta(days=i)).strftime('%d'), 'day': days[(current_date + timedelta(days=i)).weekday()]} for i in range(7)]
        return JsonResponse({'date_info': date_info, 'current_date': current_date.strftime('%Y-%m-%d')})
    else:
        current_date = datetime.now()
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        date_info = [{'date': (current_date + timedelta(days=i)).strftime('%d'), 'day': days[(current_date + timedelta(days=i)).weekday()]} for i in range(7)]
        return render(request, 'create_joborder.html', {'date_info': date_info, 'current_date': current_date})