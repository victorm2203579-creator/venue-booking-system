from datetime import date as today_date
from rest_framework import serializers
from .models import Booking
from .utils import check_booking_conflict


class BookingCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Booking
        fields = [
            'venue', 'date', 'start_time', 'end_time',
            'purpose', 'expected_attendees', 'additional_notes',
        ]

    def validate(self, data):
        venue = data.get('venue')
        booking_date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if end_time and start_time and end_time <= start_time:
            raise serializers.ValidationError(
                {'end_time': 'End time must be after start time.'}
            )

        if booking_date and booking_date <= today_date.today():
            raise serializers.ValidationError(
                {'date': 'Booking date must be in the future.'}
            )

        if venue and not venue.is_active:
            raise serializers.ValidationError(
                {'venue': 'This venue is currently inactive and cannot be booked.'}
            )

        expected = data.get('expected_attendees')
        if venue and expected and expected > venue.capacity:
            raise serializers.ValidationError(
                {
                    'expected_attendees': (
                        f'Expected attendees ({expected}) exceeds this venue\'s '
                        f'capacity ({venue.capacity}). Please choose a larger venue.'
                    )
                }
            )

        if venue and booking_date and start_time and end_time:
            exclude_id = self.instance.id if self.instance else None
            has_conflict, conflicting = check_booking_conflict(
                venue.id, booking_date, start_time, end_time, exclude_id
            )
            if has_conflict:
                raise serializers.ValidationError(
                    {
                        'non_field_errors': (
                            f'This venue is already booked between '
                            f'{conflicting.start_time.strftime("%H:%M")} and '
                            f'{conflicting.end_time.strftime("%H:%M")} on '
                            f'{conflicting.date}. '
                            f'Please choose a different time or venue.'
                        )
                    }
                )

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        return Booking.objects.create(user=user, **validated_data)


class BookingDetailSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_location = serializers.CharField(source='venue.location', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_full_name', 'user_email',
            'venue', 'venue_name', 'venue_location',
            'date', 'start_time', 'end_time',
            'purpose', 'purpose_display',
            'expected_attendees', 'additional_notes',
            'status', 'status_display', 'rejection_reason',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class BookingListSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user_full_name', 'user_email',
            'venue_name', 'date', 'start_time', 'end_time',
            'purpose', 'purpose_display', 'expected_attendees',
            'status', 'status_display', 'created_at',
        ]


class PendingBookingSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_location = serializers.CharField(source='venue.location', read_only=True)
    venue_capacity = serializers.IntegerField(source='venue.capacity', read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'user_full_name', 'user_email', 'user_role',
            'venue_name', 'venue_location', 'venue_capacity',
            'date', 'start_time', 'end_time',
            'purpose', 'purpose_display',
            'expected_attendees', 'additional_notes',
            'created_at',
        ]
        read_only_fields = fields
