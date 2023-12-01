from django import template
from datetime import datetime, timedelta

register = template.Library()

@register.simple_tag
def get_date_range(start_date_str):
    # Convert the string to a date object
    start_date = datetime.strptime(start_date_str, '%A, %d %b %Y').date()

    # Generate a list of dates
    return [start_date + timedelta(days=i) for i in range(7)]