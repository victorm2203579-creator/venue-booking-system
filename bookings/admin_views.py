from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Booking


def booking_stats_view(request):
    """
    GET /api/bookings/stats/
    Admin-only dashboard stats. Authenticated via JWT Bearer token.
    """
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    # Manual JWT authentication (plain Django view, not DRF)
    auth = JWTAuthentication()
    try:
        result = auth.authenticate(request)
        if result is None:
            return JsonResponse({'detail': 'Authentication credentials were not provided.'}, status=401)
        user, _ = result
    except (InvalidToken, TokenError):
        return JsonResponse({'detail': 'Invalid or expired token.'}, status=401)

    if user.role != 'admin':
        return JsonResponse({'detail': 'Admin access required.'}, status=403)

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    total_bookings = Booking.objects.count()

    pending_count = Booking.objects.filter(status=Booking.Status.PENDING).count()

    # Bookings whose status was set to approved today
    approved_today = Booking.objects.filter(
        status=Booking.Status.APPROVED,
        updated_at__date=today,
    ).count()

    # Bookings rejected within the last 7 days
    rejected_this_week = Booking.objects.filter(
        status=Booking.Status.REJECTED,
        updated_at__date__gte=week_ago,
    ).count()

    # Venue with the highest count of approved bookings
    most_booked = (
        Booking.objects.filter(status=Booking.Status.APPROVED)
        .values('venue__name')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )
    most_booked_venue = most_booked['venue__name'] if most_booked else None

    # Date with the highest count of approved bookings
    busiest = (
        Booking.objects.filter(status=Booking.Status.APPROVED)
        .values('date')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )
    busiest_day = str(busiest['date']) if busiest else None

    return JsonResponse({
        'total_bookings': total_bookings,
        'pending_count': pending_count,
        'approved_today': approved_today,
        'rejected_this_week': rejected_this_week,
        'most_booked_venue': most_booked_venue,
        'busiest_day': busiest_day,
    })
