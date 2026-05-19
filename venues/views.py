from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from .models import Venue
from .serializers import VenueSerializer, VenueListSerializer
from users.permissions import IsAdminUser


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location', 'description']

    def get_serializer_class(self):
        if self.action == 'list':
            return VenueListSerializer
        return VenueSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Venue.objects.all()

        venue_type = self.request.query_params.get('venue_type')
        if venue_type:
            qs = qs.filter(venue_type=venue_type)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            try:
                qs = qs.filter(capacity__gte=int(min_capacity))
            except ValueError:
                pass

        return qs

    def destroy(self, request, *args, **kwargs):
        venue = self.get_object()
        venue.is_active = False
        venue.save()
        return Response({'detail': 'Venue deactivated.'}, status=status.HTTP_200_OK)
