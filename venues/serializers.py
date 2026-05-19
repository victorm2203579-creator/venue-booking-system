from rest_framework import serializers
from .models import Venue


class VenueSerializer(serializers.ModelSerializer):
    venue_type_display = serializers.CharField(source='get_venue_type_display', read_only=True)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'location', 'capacity', 'venue_type',
            'venue_type_display', 'description', 'facilities',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VenueListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ['id', 'name', 'location', 'capacity', 'venue_type', 'is_active']
