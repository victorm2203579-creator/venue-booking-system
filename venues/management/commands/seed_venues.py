from django.core.management.base import BaseCommand
from venues.models import Venue


VENUES = [
    # ── Real university venues (pinned to top) ───────────────────────────────
    {
        'name': 'Twin Theatre 1',
        'venue_type': 'lecture_hall',
        'capacity': 250,
        'location': 'Twin Theatre Complex',
        'description': (
            'One of two side-by-side lecture theatres in the Twin Theatre Complex. '
            'Used for large departmental lectures, examinations, and academic events.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard',
    },
    {
        'name': 'Twin Theatre 2',
        'venue_type': 'lecture_hall',
        'capacity': 250,
        'location': 'Twin Theatre Complex',
        'description': (
            'Second of the two lecture theatres in the Twin Theatre Complex. '
            'Mirrors Twin Theatre 1 in layout and facilities.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard',
    },
    {
        'name': 'LT A (Lecture Theatre A)',
        'venue_type': 'lecture_hall',
        'capacity': 250,
        'location': 'Main Academic Block',
        'description': (
            'Lecture Theatre A is a large, fully equipped hall for faculty-wide '
            'lectures, seminars, and university examinations.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard, PA System',
    },
    {
        'name': 'LT B (Lecture Theatre B)',
        'venue_type': 'lecture_hall',
        'capacity': 250,
        'location': 'Main Academic Block',
        'description': (
            'Lecture Theatre B sits adjacent to LT A and serves the same '
            'capacity. Used for departmental lectures and formal presentations.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard, PA System',
    },
    {
        'name': 'Joseph Oyeyani Makoju Memorial Hall',
        'venue_type': 'event_center',
        'capacity': 250,
        'location': 'Central Campus',
        'description': (
            'A prestigious memorial hall named in honour of Joseph Oyeyani Makoju. '
            'Used for distinguished lectures, award ceremonies, and formal university events.'
        ),
        'facilities': 'Stage, PA System, Projector, Screen, AC, Fixed Seating, Podium, Microphones',
    },
    {
        'name': 'Multi-Purpose Hall (Assembly Hall)',
        'venue_type': 'event_center',
        'capacity': 500,
        'location': 'Central Campus',
        'description': (
            'The university\'s primary assembly hall. Hosts convocations, '
            'matriculations, inter-faculty events, and large-scale gatherings.'
        ),
        'facilities': 'Stage, PA System, Projector, Large Screen, AC, Microphones, Tiered Seating, Green Room',
    },
    {
        'name': 'University Auditorium (Felele Campus)',
        'venue_type': 'event_center',
        'capacity': 500,
        'location': 'Felele Campus',
        'description': (
            'The main auditorium at Felele Campus. A premier venue for '
            'large academic and cultural events serving the Felele community.'
        ),
        'facilities': 'Stage, PA System, Projector, Large Screen, AC, Microphones, Tiered Seating',
    },
    {
        'name': 'Mathematics Classroom',
        'venue_type': 'seminar_room',
        'capacity': 80,
        'location': 'Faculty of Science Block',
        'description': (
            'Dedicated classroom for the Mathematics department. '
            'Used for tutorials, coursework sessions, and mid-sized lectures.'
        ),
        'facilities': 'Whiteboard, Projector, Fixed Seating, AC',
    },
    {
        'name': 'CSC ICT Classroom',
        'venue_type': 'lab',
        'capacity': 100,
        'location': 'Computer Science Department',
        'description': (
            'The Computer Science ICT classroom, fitted with networked workstations '
            'for practical computing classes, CBT sessions, and programming labs.'
        ),
        'facilities': '100 Computers, High-Speed Internet, Projector, AC, UPS, Printer',
    },
    {
        'name': 'Physics Classroom',
        'venue_type': 'seminar_room',
        'capacity': 80,
        'location': 'Faculty of Science Block',
        'description': (
            'Classroom for the Physics department, used for theory lectures, '
            'tutorials, and problem-solving sessions.'
        ),
        'facilities': 'Whiteboard, Projector, Fixed Seating, AC',
    },
    {
        'name': 'Biology Classroom',
        'venue_type': 'seminar_room',
        'capacity': 80,
        'location': 'Faculty of Science Block',
        'description': (
            'Classroom for the Biology department. Used for lectures, '
            'tutorials, and small-group academic sessions.'
        ),
        'facilities': 'Whiteboard, Projector, Fixed Seating, AC',
    },

    # ── General university venues ────────────────────────────────────────────
    {
        'name': 'Main Auditorium',
        'venue_type': 'event_center',
        'capacity': 500,
        'location': 'Block A, Ground Floor',
        'description': (
            'The largest event space on campus, equipped for convocations, '
            'public lectures, and major university events. Features a raised '
            'stage, professional sound system, and tiered seating.'
        ),
        'facilities': 'Stage, Professional Sound System, Projector, AC, Tiered Seating, Microphones, Green Room',
    },
    {
        'name': 'Lecture Theatre 1 (LT1)',
        'venue_type': 'lecture_hall',
        'capacity': 300,
        'location': 'Block B, Ground Floor',
        'description': (
            'A large lecture theatre designed for faculty-wide lectures and '
            'presentations. Fitted with tiered seating and modern AV equipment.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard',
    },
    {
        'name': 'Lecture Theatre 2 (LT2)',
        'venue_type': 'lecture_hall',
        'capacity': 250,
        'location': 'Block B, First Floor',
        'description': (
            'Mid-sized lecture theatre on the first floor of Block B. '
            'Ideal for departmental lectures and examinations.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Tiered Seating, Whiteboard',
    },
    {
        'name': 'Lecture Theatre 3 (LT3)',
        'venue_type': 'lecture_hall',
        'capacity': 200,
        'location': 'Block C, Ground Floor',
        'description': (
            'Compact lecture theatre in Block C suited for mid-sized classes '
            'and departmental seminars.'
        ),
        'facilities': 'Projector, Screen, AC, Whiteboard, Fixed Seating',
    },
    {
        'name': 'Seminar Room 1',
        'venue_type': 'seminar_room',
        'capacity': 50,
        'location': 'Block D, Ground Floor',
        'description': (
            'Intimate seminar room for small-group teaching, tutorials, '
            'and departmental meetings. Flexible layout available.'
        ),
        'facilities': 'Projector, Whiteboard, AC, Round Tables, Movable Chairs',
    },
    {
        'name': 'Seminar Room 2',
        'venue_type': 'seminar_room',
        'capacity': 40,
        'location': 'Block D, First Floor',
        'description': (
            'Small seminar room ideal for postgraduate seminars, '
            'thesis defences, and small workshops.'
        ),
        'facilities': 'Projector, Whiteboard, AC, Conference Table, Chairs',
    },
    {
        'name': 'ICT Lab 1',
        'venue_type': 'lab',
        'capacity': 60,
        'location': 'Block E, Ground Floor',
        'description': (
            'Computer lab with 60 workstations for practical ICT classes, '
            'computer-based tests, and programming sessions.'
        ),
        'facilities': '60 Computers, High-Speed Internet, Projector, AC, UPS, Printer',
    },
    {
        'name': 'ICT Lab 2',
        'venue_type': 'lab',
        'capacity': 60,
        'location': 'Block E, First Floor',
        'description': (
            'Second computer lab on the first floor of Block E. '
            'Used for CBT examinations and advanced computing courses.'
        ),
        'facilities': '60 Computers, High-Speed Internet, Projector, AC, UPS, Scanner',
    },
    {
        'name': 'Engineering Lab',
        'venue_type': 'lab',
        'capacity': 45,
        'location': 'Block F, Ground Floor',
        'description': (
            'Specialised engineering laboratory for electronics, circuits, '
            'and instrumentation practicals.'
        ),
        'facilities': 'Workbenches, Oscilloscopes, Multimeters, Soldering Stations, AC, Safety Equipment',
    },
    {
        'name': 'Conference Hall',
        'venue_type': 'conference_room',
        'capacity': 80,
        'location': 'Block A, First Floor',
        'description': (
            'Professional conference hall for departmental conferences, '
            'workshops, and formal meetings with external guests.'
        ),
        'facilities': 'Projector, Screen, Microphone, AC, Conference Tables, Water Dispenser, Whiteboard',
    },
    {
        'name': 'Senate Chamber',
        'venue_type': 'conference_room',
        'capacity': 100,
        'location': 'Admin Block, Second Floor',
        'description': (
            'Formal chamber used for senate meetings, academic board sessions, '
            'and high-level university governance events.'
        ),
        'facilities': 'Projector, PA System, AC, Fixed Conference Seating, Recording Equipment, Dais',
    },
    {
        'name': 'Sports Hall',
        'venue_type': 'sports_hall',
        'capacity': 200,
        'location': 'Sports Complex',
        'description': (
            'Multi-purpose indoor sports hall for badminton, basketball, '
            'table tennis, and university sports events.'
        ),
        'facilities': 'Basketball Court, Badminton Nets, Table Tennis Tables, Changing Rooms, Scoreboard',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with university venues'

    def handle(self, *args, **kwargs):
        created_count = 0
        skipped_count = 0

        for data in VENUES:
            venue, created = Venue.objects.get_or_create(
                name=data['name'],
                defaults=data,
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {venue.name}'))
            else:
                skipped_count += 1
                self.stdout.write(self.style.WARNING(f'  Skipped (already exists): {venue.name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done. {created_count} venue(s) created, {skipped_count} skipped.'
        ))
