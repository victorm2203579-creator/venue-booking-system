from .models import Booking


def check_booking_conflict(venue_id, date, start_time, end_time, exclude_booking_id=None):
    """
    Detect whether a requested time slot conflicts with any existing booking.

    Two time ranges [A_start, A_end) and [B_start, B_end) overlap when:
        NOT (A_end <= B_start  OR  A_start >= B_end)

    Rearranging, they overlap when BOTH hold simultaneously:
        A_start < B_end   AND   A_end > B_start

    So we query bookings where:
        existing.start_time < requested_end_time
        AND
        existing.end_time   > requested_start_time

    Only pending and approved bookings block a slot; rejected and
    cancelled ones are ignored because they no longer hold the venue.

    Args:
        venue_id:           PK of the venue to check.
        date:               The booking date (datetime.date).
        start_time:         Requested start (datetime.time).
        end_time:           Requested end (datetime.time).
        exclude_booking_id: Skip this booking ID (used when editing an
                            existing booking so it doesn't conflict with itself).

    Returns:
        (has_conflict: bool, conflicting_booking: Booking | None)
    """
    qs = Booking.objects.filter(
        venue_id=venue_id,
        date=date,
        status__in=[Booking.Status.PENDING, Booking.Status.APPROVED],
        start_time__lt=end_time,
        end_time__gt=start_time,
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    conflicting = qs.select_related('venue').first()
    return (conflicting is not None, conflicting)
