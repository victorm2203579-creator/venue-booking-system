import uuid
from django.conf import settings
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        BOOKING_SUBMITTED = 'booking_submitted', 'Booking Submitted'
        BOOKING_APPROVED = 'booking_approved', 'Booking Approved'
        BOOKING_REJECTED = 'booking_rejected', 'Booking Rejected'
        BOOKING_CANCELLED = 'booking_cancelled', 'Booking Cancelled'
        BOOKING_REMINDER = 'booking_reminder', 'Booking Reminder'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        state = 'read' if self.is_read else 'unread'
        return f"{self.notification_type} → {self.user.email} ({state})"
