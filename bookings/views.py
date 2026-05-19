from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .reports import (
    get_booking_summary,
    get_venue_utilization,
    get_busiest_time_slots,
    get_monthly_trend,
    get_top_users,
)

from users.permissions import IsAdminUser, IsOwnerOrAdmin
from .models import Booking
from .serializers import (
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    PendingBookingSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        if self.action in ('retrieve', 'cancel'):
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        if self.action in ('approve', 'reject', 'pending_list'):
            return [IsAdminUser()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        if self.action == 'list':
            return BookingListSerializer
        if self.action == 'pending_list':
            return PendingBookingSerializer
        return BookingDetailSerializer

    def create(self, request, *args, **kwargs):
        from notifications.utils import send_booking_notification
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        send_booking_notification(booking, action='submitted')
        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Booking.objects.select_related('venue', 'user').all()
        else:
            qs = Booking.objects.select_related('venue', 'user').filter(user=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(date=date_filter)

        venue_id = self.request.query_params.get('venue_id')
        if venue_id:
            qs = qs.filter(venue_id=venue_id)

        return qs

    # ------------------------------------------------------------------ #
    #  Owner actions
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        from notifications.utils import send_booking_notification
        booking = self.get_object()

        if booking.user != request.user:
            return Response(
                {'detail': 'Only the booking owner can cancel.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status not in (Booking.Status.PENDING, Booking.Status.APPROVED):
            return Response(
                {'detail': f'Cannot cancel a booking with status "{booking.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = Booking.Status.CANCELLED
        booking.save()
        send_booking_notification(booking, action='cancelled')
        return Response(
            {'detail': 'Your booking has been cancelled successfully.'},
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------ #
    #  Admin actions
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        from notifications.utils import send_booking_notification
        booking = self.get_object()

        if booking.status != Booking.Status.PENDING:
            return Response(
                {
                    'detail': (
                        f'Only pending bookings can be approved. '
                        f'This booking is currently {booking.status}.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            booking.status = Booking.Status.APPROVED
            booking.save()
            send_booking_notification(booking, action='approved')

        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='reject')
    def reject(self, request, pk=None):
        from notifications.utils import send_booking_notification
        booking = self.get_object()

        rejection_reason = request.data.get('rejection_reason', '').strip()
        if not rejection_reason:
            return Response(
                {'rejection_reason': 'A rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status != Booking.Status.PENDING:
            return Response(
                {
                    'detail': (
                        f'Only pending bookings can be rejected. '
                        f'This booking is currently {booking.status}.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            booking.status = Booking.Status.REJECTED
            booking.rejection_reason = rejection_reason
            booking.save()
            send_booking_notification(booking, action='rejected')

        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='pending')
    def pending_list(self, request):
        qs = (
            Booking.objects.select_related('venue', 'user')
            .filter(status=Booking.Status.PENDING)
            .order_by('created_at')
        )
        serializer = PendingBookingSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        period = request.query_params.get('period', 'week')
        if period not in ('today', 'week', 'month'):
            period = 'week'
        return Response(get_booking_summary(period))

    @action(detail=False, methods=['get'], url_path='venue-utilization')
    def venue_utilization(self, request):
        return Response(get_venue_utilization())

    @action(detail=False, methods=['get'], url_path='busiest-slots')
    def busiest_slots(self, request):
        return Response(get_busiest_time_slots())

    @action(detail=False, methods=['get'], url_path='monthly-trend')
    def monthly_trend(self, request):
        return Response(get_monthly_trend())

    @action(detail=False, methods=['get'], url_path='top-users')
    def top_users(self, request):
        limit = max(1, int(request.query_params.get('limit', 5)))
        return Response(get_top_users(limit))
