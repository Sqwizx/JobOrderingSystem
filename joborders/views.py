from datetime import datetime, timedelta
from django.shortcuts import render
from django.http import JsonResponse

from django.contrib.auth.decorators import login_required

@login_required
def create_joborder(request):
      current_date = datetime.now()
      days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']  # Adjust the order based on your requirements
      date_info = [{'date': (current_date + timedelta(days=i)).strftime('%d'), 'day': days[(current_date + timedelta(days=i)).weekday()]} for i in range(7)]
      return render(request, 'create_joborder.html', {'date_info': date_info, 'current_date': current_date})