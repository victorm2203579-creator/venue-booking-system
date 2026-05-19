from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source='get_notification_type_display', read_only=True
    )
    venue_name = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'booking',
            'venue_name', 'booking_date',
            'message', 'notification_type', 'notification_type_display',
            'is_read', 'created_at',
        ]
        read_only_fields = fields

    def get_venue_name(self, obj):
        if obj.booking_id and obj.booking:
            return obj.booking.venue.name
        return None

    def get_booking_date(self, obj):
        if obj.booking_id and obj.booking:
            return str(obj.booking.date)
        return None
