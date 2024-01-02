from .models import UserRole

def user_role_context(request):
    user = request.user
    if user.is_authenticated:
        try:
            user_role = UserRole.objects.get(user=user).get_role_display()
        except UserRole.DoesNotExist:
            user_role = None
    else:
        user_role = None

    return {
        'username': user.username if user.is_authenticated else 'Guest',
        'user_role': user_role
    }