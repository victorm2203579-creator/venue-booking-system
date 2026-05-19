from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import ExtractHour, TruncMonth
from django.utils import timezone


# 4 two-hour slots per 8-hour working day * 30 days
_POSSIBLE_SLOTS_30_DAYS = 120


def get_booking_summary(period='week'):
    from .models import Booking

    today = timezone.now().date()

    if period == 'today':
        start_date = today
    elif period == 'month':
        start_date = today - timedelta(days=30)
    else:  # default: week
        period = 'week'
        start_date = today - timedelta(days=7)

    qs = Booking.objects.filter(created_at__date__gte=start_date)

    return {
        'period': period,
        'from_date': str(start_date),
        'to_date': str(today),
        'total_bookings': qs.count(),
        'approved': qs.filter(status='approved').count(),
        'rejected': qs.filter(status='rejected').count(),
        'pending': qs.filter(status='pending').count(),
        'cancelled': qs.filter(status='cancelled').count(),
    }


def get_venue_utilization():
    from .models import Booking
    from venues.models import Venue

    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)

    venues = Venue.objects.all()
    result = []

    for venue in venues:
        qs = Booking.objects.filter(
            venue=venue,
            date__gte=thirty_days_ago,
            date__lte=today,
        )
        total = qs.count()
        approved = qs.filter(status='approved').count()
        rejected = qs.filter(status='rejected').count()

        rejection_rate = round(rejected / total * 100, 1) if total > 0 else 0.0
        utilization_rate = round(
            min(approved / _POSSIBLE_SLOTS_30_DAYS * 100, 100.0), 1
        )

        result.append({
            'venue_name': venue.name,
            'venue_type': venue.get_venue_type_display(),
            'capacity': venue.capacity,
            'total_bookings': total,
            'approved_bookings': approved,
            'rejection_rate': rejection_rate,
            'utilization_rate': utilization_rate,
        })

    return sorted(result, key=lambda v: v['utilization_rate'], reverse=True)


def get_busiest_time_slots():
    from .models import Booking

    counts = dict(
        Booking.objects.filter(status='approved')
        .annotate(hour=ExtractHour('start_time'))
        .values('hour')
        .annotate(count=Count('id'))
        .values_list('hour', 'count')
    )

    return [
        {'hour': f'{h:02d}:00', 'booking_count': counts.get(h, 0)}
        for h in range(24)
    ]


def get_monthly_trend():
    from .models import Booking

    today = timezone.now().date()
    six_months_ago = today - timedelta(days=180)

    rows = (
        Booking.objects.filter(created_at__date__gte=six_months_ago)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            total=Count('id'),
            approved=Count('id', filter=Q(status='approved')),
        )
        .order_by('month')
    )

    return [
        {
            'month': row['month'].strftime('%B %Y'),
            'total': row['total'],
            'approved': row['approved'],
        }
        for row in rows
    ]


def get_top_users(limit=5):
    from django.contrib.auth import get_user_model

    User = get_user_model()

    top = (
        User.objects.annotate(
            approved_count=Count(
                'bookings',
                filter=Q(bookings__status='approved'),
            )
        )
        .filter(approved_count__gt=0)
        .order_by('-approved_count')[:limit]
    )

    return [
        {
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'approved_count': user.approved_count,
        }
        for user in top
    ]
