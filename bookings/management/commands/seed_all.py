from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model

User = get_user_model()

SEP  = '=' * 64
THIN = '-' * 64

SEED_USERS = [
    {
        'email':        'admin@university.edu',
        'password':     'Admin@1234',
        'full_name':    'System Administrator',
        'role':         'admin',
        'is_staff':     True,
        'is_superuser': True,
        'matric_number': None,
    },
    {
        'email':        'john.doe@student.edu',
        'password':     'Student@1234',
        'full_name':    'John Doe',
        'role':         'student',
        'matric_number': 'STU/2021/001',
    },
    {
        'email':        'jane.smith@student.edu',
        'password':     'Student@1234',
        'full_name':    'Jane Smith',
        'role':         'student',
        'matric_number': 'STU/2021/002',
    },
    {
        'email':        'dr.adams@university.edu',
        'password':     'Staff@1234',
        'full_name':    'Dr. Adams',
        'role':         'staff',
        'matric_number': None,
    },
]


def _create_notifications(w, users_created):
    """Create a handful of sample notifications for every seeded user."""
    from notifications.models import Notification
    from bookings.models import Booking

    created = 0
    TYPE = Notification.NotificationType

    for user in users_created:
        # Skip entirely if this user already has notifications
        if Notification.objects.filter(user=user).exists():
            continue

        booking = Booking.objects.filter(user=user).first()

        Notification.objects.create(
            user=user,
            booking=None,
            notification_type=TYPE.BOOKING_SUBMITTED,
            message=(
                f'Welcome to the Venue Booking System, {user.full_name}! '
                f'Browse available venues and submit your first booking.'
            ),
        )
        created += 1

        if booking:
            Notification.objects.create(
                user=user,
                booking=booking,
                notification_type=TYPE.BOOKING_SUBMITTED,
                message=(
                    f'Your booking for {booking.venue.name} on {booking.date} '
                    f'from {booking.start_time.strftime("%H:%M")} to '
                    f'{booking.end_time.strftime("%H:%M")} has been submitted '
                    f'and is awaiting admin approval.'
                ),
            )
            created += 1

            if booking.status == 'approved':
                Notification.objects.create(
                    user=user,
                    booking=booking,
                    notification_type=TYPE.BOOKING_APPROVED,
                    message=(
                        f'Your booking for {booking.venue.name} on {booking.date} '
                        f'has been approved.'
                    ),
                )
                created += 1
            elif booking.status == 'rejected':
                Notification.objects.create(
                    user=user,
                    booking=booking,
                    notification_type=TYPE.BOOKING_REJECTED,
                    message=(
                        f'Your booking for {booking.venue.name} on {booking.date} '
                        f'was rejected. Reason: {booking.rejection_reason or "See admin."}'
                    ),
                )
                created += 1

    return created


class Command(BaseCommand):
    help = 'Master seed: venues → users → bookings → notifications'

    def handle(self, *args, **options):
        w = self.stdout.write
        S = self.style.SUCCESS
        H = self.style.HTTP_INFO
        W = self.style.WARNING

        w('')
        w(S(SEP))
        w(S('  VENUE BOOKING SYSTEM — FULL SEED'))
        w(S(SEP))

        # ── Step 1: Venues ──────────────────────────────────────────────
        w('')
        w(H('STEP 1 — Venues'))
        w(THIN)
        call_command('seed_venues', stdout=self.stdout)

        # ── Step 2: Users ───────────────────────────────────────────────
        w('')
        w(H('STEP 2 — Core Users'))
        w(THIN)
        users_created = []
        users_skipped = 0

        for data in SEED_USERS:
            email    = data['email']
            password = data.pop('password')

            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
                user.set_password(password)
                user.save(update_fields=['password'])
                users_skipped += 1
                w(W(f'  Updated  (exists): {email}'))
            else:
                user = User.objects.create_user(password=password, **data)
                users_created.append(user)
                w(S(f'  Created : {email}  [{user.role}]'))

            data['password'] = password  # restore for potential re-run reporting

        # ── Step 3: Bookings ────────────────────────────────────────────
        w('')
        w(H('STEP 3 — Sample Bookings'))
        w(THIN)
        call_command('seed_bookings', stdout=self.stdout)

        # ── Step 4: Notifications ───────────────────────────────────────
        w('')
        w(H('STEP 4 — Sample Notifications'))
        w(THIN)

        all_seed_users = list(
            User.objects.filter(email__in=[d['email'] for d in SEED_USERS])
        )
        notifs_created = _create_notifications(w, all_seed_users)
        w(S(f'  {notifs_created} notification(s) created.'))

        # ── Summary table ───────────────────────────────────────────────
        from venues.models import Venue
        from bookings.models import Booking
        from notifications.models import Notification

        w('')
        w(S(SEP))
        w(S('  SEED COMPLETE — SUMMARY'))
        w(S(SEP))
        w(f'  {"Venues":25} {Venue.objects.count():>6}')
        w(f'  {"Users":25} {User.objects.count():>6}')
        w(f'  {"Bookings":25} {Booking.objects.count():>6}')
        w(f'  {"Notifications":25} {Notification.objects.count():>6}')
        w('')
        w(H('  Demo login credentials:'))
        w(f'  {"Role":<10} {"Email":<35} Password')
        w('  ' + THIN)
        for data in SEED_USERS:
            role  = data.get('role', '?')
            email = data['email']
            pwd   = data['password']
            w(f'  {role:<10} {email:<35} {pwd}')
        w('')
        w(S(SEP))
        w('')
