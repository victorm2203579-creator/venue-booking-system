from django.core.management.base import BaseCommand
from bookings.reports import (
    get_booking_summary,
    get_venue_utilization,
    get_busiest_time_slots,
    get_monthly_trend,
    get_top_users,
)

SEP = '=' * 64
THIN = '-' * 64


class Command(BaseCommand):
    help = 'Print a formatted analytics report to the terminal'

    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            default='week',
            choices=['today', 'week', 'month'],
            help='Reporting period for the booking summary (default: week)',
        )

    def handle(self, *args, **options):
        period = options['period']
        w = self.stdout.write
        S = self.style.SUCCESS
        H = self.style.HTTP_INFO

        w('')
        w(S(SEP))
        w(S('  VENUE BOOKING SYSTEM  --  ANALYTICS REPORT'))
        w(S(SEP))

        # ── Booking Summary ──────────────────────────────────────────
        summary = get_booking_summary(period)
        w('')
        w(H(f'BOOKING SUMMARY  ({period.upper()})'))
        w(f'  Period    : {summary["from_date"]}  to  {summary["to_date"]}')
        w(f'  Total     : {summary["total_bookings"]}')
        w(f'  Approved  : {summary["approved"]}')
        w(f'  Pending   : {summary["pending"]}')
        w(f'  Rejected  : {summary["rejected"]}')
        w(f'  Cancelled : {summary["cancelled"]}')

        # ── Venue Utilization ────────────────────────────────────────
        w('')
        w(H('VENUE UTILIZATION  (last 30 days)'))
        w(f'  {"Venue":<32} {"Total":>6} {"Approved":>9} {"Reject%":>8} {"Util%":>6}')
        w('  ' + THIN)
        for v in get_venue_utilization():
            w(
                f'  {v["venue_name"]:<32} {v["total_bookings"]:>6} '
                f'{v["approved_bookings"]:>9} {v["rejection_rate"]:>7.1f}% '
                f'{v["utilization_rate"]:>5.1f}%'
            )

        # ── Busiest Time Slots ───────────────────────────────────────
        w('')
        w(H('BUSIEST TIME SLOTS  (approved bookings by hour)'))
        slots = get_busiest_time_slots()
        active = sorted(
            [s for s in slots if s['booking_count'] > 0],
            key=lambda s: s['booking_count'],
            reverse=True,
        )
        if active:
            for slot in active[:8]:
                bar = '#' * slot['booking_count']
                w(f'  {slot["hour"]}  {bar:<20} {slot["booking_count"]}')
        else:
            w('  No approved bookings found.')

        # ── Monthly Trend ────────────────────────────────────────────
        w('')
        w(H('MONTHLY TREND  (last 6 months)'))
        trend = get_monthly_trend()
        if trend:
            for entry in trend:
                w(
                    f'  {entry["month"]:<20}  '
                    f'Total: {entry["total"]:>4}   '
                    f'Approved: {entry["approved"]:>4}'
                )
        else:
            w('  No data in the last 6 months.')

        # ── Top Users ────────────────────────────────────────────────
        w('')
        w(H('TOP 5 USERS BY APPROVED BOOKINGS'))
        top = get_top_users(5)
        if top:
            for i, user in enumerate(top, 1):
                w(
                    f'  {i}. {user["full_name"]:<26} ({user["role"]:<7})  '
                    f'{user["approved_count"]} approved'
                )
        else:
            w('  No approved bookings recorded yet.')

        w('')
        w(S(SEP))
        w('')
