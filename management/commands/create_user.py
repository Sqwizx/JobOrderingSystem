# your_app/management/commands/create_user_with_role.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserRole  # Replace 'your_app' with your actual app name

class Command(BaseCommand):
    help = 'Create a new user with a role or list available roles'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, nargs='?', default=None)
        parser.add_argument('email', type=str, nargs='?', default=None)
        parser.add_argument('password', type=str, nargs='?', default=None)
        parser.add_argument('role', type=str, nargs='?', default=None)
        parser.add_argument('--list-roles', action='store_true', help='List all available roles')

    def handle(self, *args, **kwargs):
        if kwargs['list_roles']:
            self.stdout.write("Available roles are:")
            for role, role_display in UserRole.ROLE_CHOICES:
                self.stdout.write(f"{role}: {role_display}")
            return

        username = kwargs['username']
        email = kwargs['email']
        password = kwargs['password']
        role = kwargs['role']

        if not all([username, email, password, role]):
            self.stdout.write(self.style.ERROR("Missing arguments: username, email, password, and role are required."))
            return

        if role not in dict(UserRole.ROLE_CHOICES):
            self.stderr.write(self.style.ERROR(f"Invalid role: {role}"))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))
            return

        user = User.objects.create_user(username, email, password)
        UserRole.objects.create(user=user, role=role)

        self.stdout.write(self.style.SUCCESS(f'Successfully created user {username} with role {role}'))
