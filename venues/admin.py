from django.contrib import admin
from .models import Venue


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'capacity', 'venue_type', 'is_active']
    list_filter = ['venue_type', 'is_active']
    search_fields = ['name', 'location']
