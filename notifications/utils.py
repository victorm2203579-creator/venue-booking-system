from django.db import transaction
from django.contrib.auth import get_user_model


def send_booking_notification(booking, action):
    """
    Creates Notification records after a booking status change.
    Never raises — all errors are caught and printed so the calling
    view is never broken by a notification failure.

    action values: 'submitted', 'approved', 'rejected', 'cancelled'
    """
    try:
        from .models import Notification

        User = get_user_model()
        venue_name = booking.venue.name
        date = booking.date
        start = booking.start_time.strftime('%H:%M')
        end = booking.end_time.strftime('%H:%M')
        owner = booking.user
        purpose = booking.get_purpose_display()
        reason = booking.rejection_reason or 'No reason provided'

        TYPE = Notification.NotificationType

        type_map = {
            'submitted': TYPE.BOOKING_SUBMITTED,
            'approved':  TYPE.BOOKING_APPROVED,
            'rejected':  TYPE.BOOKING_REJECTED,
            'cancelled': TYPE.BOOKING_CANCELLED,
        }
        notification_type = type_map.get(action, TYPE.BOOKING_SUBMITTED)

        with transaction.atomic():
            if action == 'submitted':
                # Notify booking owner
                Notification.objects.create(
                    user=owner,
                    booking=booking,
                    notification_type=notification_type,
                    message=(
                        f'Your booking request for {venue_name} on {date} from '
                        f'{start} to {end} has been submitted and is awaiting '
                        f'admin approval.'
                    ),
                )
                # Notify every admin
                admins = User.objects.filter(role='admin')
                Notification.objects.bulk_create([
                    Notification(
                        user=admin,
                        booking=booking,
                        notification_type=notification_type,
                        message=(
                            f'New booking request from {owner.full_name} '
                            f'for {venue_name} on {date} from {start} to {end}. '
                            f'Action required.'
                        ),
                    )
                    for admin in admins
                ])

            elif action == 'approved':
                Notification.objects.create(
                    user=owner,
                    booking=booking,
                    notification_type=notification_type,
                    message=(
                        f'Great news! Your booking for {venue_name} on {date} from '
                        f'{start} to {end} has been approved. Purpose: {purpose}.'
                    ),
                )

            elif action == 'rejected':
                Notification.objects.create(
                    user=owner,
                    booking=booking,
                    notification_type=notification_type,
                    message=(
                        f'Your booking for {venue_name} on {date} has been rejected. '
                        f'Reason: {reason}.'
                    ),
                )

            elif action == 'cancelled':
                Notification.objects.create(
                    user=owner,
                    booking=booking,
                    notification_type=notification_type,
                    message=(
                        f'Your booking for {venue_name} on {date} has been '
                        f'successfully cancelled.'
                    ),
                )

    except Exception as e:
        print(f'[NOTIFICATION ERROR] action={action} booking_id={booking.id}: {e}')
