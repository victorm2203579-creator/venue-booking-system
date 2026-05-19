from datetime import time, date
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from venues.models import Venue
from bookings.models import Booking

User = get_user_model()

SEED_USERS = [
    {
        'full_name': 'Alice Johnson',
        'email': 'alice@venue.test',
        'password': 'Student@12345',
        'role': 'student',
        'matric_number': 'CSC/2021/001',
    },
    {
        'full_name': 'Bob Okafor',
        'email': 'bob@venue.test',
        'password': 'Student@12345',
        'role': 'student',
        'matric_number': 'ENG/2022/015',
    },
    {
        'full_name': 'Cynthia Adamu',
        'email': 'cynthia@venue.test',
        'password': 'Student@12345',
        'role': 'student',
        'matric_number': 'LAW/2020/008',
    },
    {
        'full_name': 'David Eze',
        'email': 'david@venue.test',
        'password': 'Staff@12345',
        'role': 'staff',
        'matric_number': None,
    },
]

# Each entry: (venue_name, date, start, end, user_email, purpose, status, attendees, notes)
# Designed so no two pending/approved bookings share the same venue+date with overlapping times.
SEED_BOOKINGS = [
    ('Main Auditorium',           date(2026, 6,  2), time(8,  0), time(10, 0), 'alice@venue.test',   'event',        'approved',  400, 'Annual science fair opening ceremony'),
    ('Main Auditorium',           date(2026, 6,  3), time(13, 0), time(15, 0), 'bob@venue.test',     'lecture',      'approved',  280, 'Faculty-wide guest lecture series'),
    ('Lecture Theatre 1 (LT1)',   date(2026, 6,  2), time(10, 0), time(12, 0), 'alice@venue.test',   'lecture',      'approved',  200, 'CSC 301 weekly lecture'),
    ('Lecture Theatre 1 (LT1)',   date(2026, 6,  3), time(8,  0), time(10, 0), 'cynthia@venue.test', 'exam',         'pending',   250, 'LAW 401 mid-semester examination'),
    ('Lecture Theatre 1 (LT1)',   date(2026, 6,  4), time(13, 0), time(15, 0), 'bob@venue.test',     'seminar',      'rejected',  150, 'Research methodology seminar'),
    ('Lecture Theatre 2 (LT2)',   date(2026, 6,  2), time(13, 0), time(15, 0), 'bob@venue.test',     'lecture',      'approved',  180, 'ENG 201 thermodynamics lecture'),
    ('Lecture Theatre 2 (LT2)',   date(2026, 6,  4), time(8,  0), time(10, 0), 'alice@venue.test',   'exam',         'approved',  200, 'CSC 201 data structures exam'),
    ('Lecture Theatre 2 (LT2)',   date(2026, 6,  5), time(15, 0), time(17, 0), 'cynthia@venue.test', 'workshop',     'pending',   100, 'Moot court advocacy workshop'),
    ('Lecture Theatre 3 (LT3)',   date(2026, 6,  3), time(10, 0), time(12, 0), 'david@venue.test',   'departmental', 'approved',  180, 'Engineering departmental briefing'),
    ('Lecture Theatre 3 (LT3)',   date(2026, 6,  5), time(8,  0), time(10, 0), 'alice@venue.test',   'lecture',      'pending',   150, 'CSC 401 final year lecture'),
    ('Lecture Theatre 3 (LT3)',   date(2026, 6,  6), time(13, 0), time(15, 0), 'bob@venue.test',     'seminar',      'cancelled', 100, 'Cancelled — clash with departmental exam'),
    ('Seminar Room 1',            date(2026, 6,  2), time(8,  0), time(10, 0), 'cynthia@venue.test', 'meeting',      'approved',   30, 'Student council executive meeting'),
    ('Seminar Room 1',            date(2026, 6,  4), time(15, 0), time(17, 0), 'alice@venue.test',   'workshop',     'pending',    40, 'Peer tutoring session'),
    ('Seminar Room 1',            date(2026, 6,  6), time(10, 0), time(12, 0), 'david@venue.test',   'meeting',      'rejected',   25, 'Room capacity insufficient for planned group'),
    ('Seminar Room 2',            date(2026, 6,  3), time(13, 0), time(15, 0), 'bob@venue.test',     'seminar',      'approved',   35, 'Constitutional law seminar'),
    ('Seminar Room 2',            date(2026, 6,  5), time(8,  0), time(10, 0), 'cynthia@venue.test', 'meeting',      'cancelled',  30, 'Cancelled — presenter unavailable'),
    ('Seminar Room 2',            date(2026, 6,  7), time(15, 0), time(17, 0), 'alice@venue.test',   'workshop',     'pending',    20, 'Final year project review workshop'),
    ('ICT Lab 1',                 date(2026, 6,  2), time(15, 0), time(17, 0), 'david@venue.test',   'lecture',      'approved',   50, 'Database systems practical session'),
    ('ICT Lab 1',                 date(2026, 6,  4), time(8,  0), time(10, 0), 'bob@venue.test',     'workshop',     'approved',   55, 'Python programming bootcamp'),
    ('ICT Lab 1',                 date(2026, 6,  6), time(13, 0), time(15, 0), 'cynthia@venue.test', 'exam',         'pending',    45, 'Computer-based test — LAW elective'),
    ('ICT Lab 2',                 date(2026, 6,  3), time(8,  0), time(10, 0), 'alice@venue.test',   'lecture',      'approved',   60, 'Web development lab — CSC 302'),
    ('ICT Lab 2',                 date(2026, 6,  5), time(15, 0), time(17, 0), 'david@venue.test',   'exam',         'rejected',   50, 'Insufficient academic justification provided'),
    ('ICT Lab 2',                 date(2026, 6,  7), time(10, 0), time(12, 0), 'bob@venue.test',     'workshop',     'pending',    40, 'React.js hands-on workshop'),
    ('Engineering Lab',           date(2026, 6,  2), time(10, 0), time(12, 0), 'cynthia@venue.test', 'seminar',      'approved',   40, 'Electronics circuits practical lab'),
    ('Engineering Lab',           date(2026, 6,  4), time(13, 0), time(15, 0), 'david@venue.test',   'meeting',      'cancelled',  35, 'Cancelled — facilitator rescheduled'),
    ('Conference Hall',           date(2026, 6,  3), time(10, 0), time(12, 0), 'alice@venue.test',   'event',        'approved',   70, 'Annual undergraduate research conference'),
    ('Conference Hall',           date(2026, 6,  5), time(13, 0), time(15, 0), 'bob@venue.test',     'departmental', 'pending',    60, 'Engineering faculty departmental forum'),
    ('Senate Chamber',            date(2026, 6,  2), time(13, 0), time(15, 0), 'david@venue.test',   'meeting',      'approved',   80, 'Interdepartmental coordination meeting'),
    ('Senate Chamber',            date(2026, 6,  6), time(8,  0), time(10, 0), 'cynthia@venue.test', 'event',        'rejected',   90, 'Senate Chamber reserved for official senate use only'),
    ('Sports Hall',               date(2026, 6,  4), time(15, 0), time(17, 0), 'alice@venue.test',   'event',        'approved',  150, 'Inter-faculty sports competition opening'),
]


class Command(BaseCommand):
    help = 'Seed the database with sample users and 30 bookings'

    def handle(self, *args, **kwargs):
        self.stdout.write('--- Creating seed users ---')
        users_created = 0
        user_map = {}

        for data in SEED_USERS:
            email = data['email']
            if User.objects.filter(email=email).exists():
                self.stdout.write(self.style.WARNING(f'  Skipped user (exists): {email}'))
                user_map[email] = User.objects.get(email=email)
            else:
                password = data.pop('password')
                user = User.objects.create_user(password=password, **data)
                user_map[email] = user
                users_created += 1
                self.stdout.write(self.style.SUCCESS(f'  Created user: {email} ({user.role})'))

        self.stdout.write('')
        self.stdout.write('--- Creating seed bookings ---')
        bookings_created = 0
        bookings_skipped = 0

        status_counts = {'approved': 0, 'pending': 0, 'rejected': 0, 'cancelled': 0}

        for (venue_name, bdate, start, end, user_email,
             purpose, bstatus, attendees, notes) in SEED_BOOKINGS:

            try:
                venue = Venue.objects.get(name=venue_name)
            except Venue.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'  Venue not found: {venue_name} — run seed_venues first')
                )
                continue

            user = user_map.get(user_email)
            if not user:
                self.stdout.write(self.style.ERROR(f'  User not found: {user_email}'))
                continue

            exists = Booking.objects.filter(
                venue=venue, date=bdate, start_time=start, end_time=end, user=user
            ).exists()

            if exists:
                bookings_skipped += 1
                self.stdout.write(self.style.WARNING(
                    f'  Skipped (exists): {venue_name} on {bdate} {start}–{end}'
                ))
                continue

            Booking.objects.create(
                user=user,
                venue=venue,
                date=bdate,
                start_time=start,
                end_time=end,
                purpose=purpose,
                expected_attendees=attendees,
                additional_notes=notes,
                status=bstatus,
            )
            bookings_created += 1
            status_counts[bstatus] += 1
            self.stdout.write(self.style.SUCCESS(
                f'  Created: {venue_name} | {bdate} {start.strftime("%H:%M")}–{end.strftime("%H:%M")} '
                f'| {bstatus.upper()} | {user_email}'
            ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== Seed Summary ==='))
        self.stdout.write(f'  Users created:    {users_created}')
        self.stdout.write(f'  Bookings created: {bookings_created}')
        self.stdout.write(f'  Bookings skipped: {bookings_skipped}')
        self.stdout.write(f'  Status breakdown:')
        for s, count in status_counts.items():
            self.stdout.write(f'    {s.capitalize():<12} {count}')
