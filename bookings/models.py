import uuid
from django.conf import settings
from django.db import models


class Booking(models.Model):

    class Purpose(models.TextChoices):
        LECTURE = 'lecture', 'Lecture'
        SEMINAR = 'seminar', 'Seminar'
        MEETING = 'meeting', 'Meeting'
        EVENT = 'event', 'Event'
        EXAM = 'exam', 'Exam'
        WORKSHOP = 'workshop', 'Workshop'
        DEPARTMENTAL = 'departmental', 'Departmental'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='bookings'
    )
    venue = models.ForeignKey(
        'venues.Venue', on_delete=models.PROTECT, related_name='bookings'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    expected_attendees = models.PositiveIntegerField()
    additional_notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.venue.name} — {self.date} {self.start_time}–{self.end_time} ({self.status})"
