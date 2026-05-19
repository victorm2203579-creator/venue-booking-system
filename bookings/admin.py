from django.contrib import admin
from django.utils.translation import ngettext
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['user', 'venue', 'date', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'date', 'venue']
    search_fields = ['user__email', 'venue__name', 'purpose']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    actions = ['approve_bookings', 'reject_bookings']

    @admin.action(description='Approve selected pending bookings')
    def approve_bookings(self, request, queryset):
        pending = queryset.filter(status=Booking.Status.PENDING)
        updated = pending.update(status=Booking.Status.APPROVED)
        self.message_user(
            request,
            ngettext(
                '%d booking was approved.',
                '%d bookings were approved.',
                updated,
            ) % updated,
        )

    @admin.action(description='Reject selected pending bookings')
    def reject_bookings(self, request, queryset):
        pending = queryset.filter(status=Booking.Status.PENDING)
        updated = pending.update(
            status=Booking.Status.REJECTED,
            rejection_reason='Rejected via bulk admin action.',
        )
        self.message_user(
            request,
            ngettext(
                '%d booking was rejected.',
                '%d bookings were rejected.',
                updated,
            ) % updated,
        )
