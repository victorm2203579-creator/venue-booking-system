import uuid
from django.db import models


class Venue(models.Model):

    class VenueType(models.TextChoices):
        LECTURE_HALL = 'lecture_hall', 'Lecture Hall'
        SEMINAR_ROOM = 'seminar_room', 'Seminar Room'
        LAB = 'lab', 'Lab'
        EVENT_CENTER = 'event_center', 'Event Center'
        CONFERENCE_ROOM = 'conference_room', 'Conference Room'
        SPORTS_HALL = 'sports_hall', 'Sports Hall'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=200)
    capacity = models.PositiveIntegerField()
    venue_type = models.CharField(max_length=20, choices=VenueType.choices)
    description = models.TextField(blank=True, null=True)
    facilities = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'venues'

    def __str__(self):
        return f"{self.name} ({self.get_venue_type_display()})"
