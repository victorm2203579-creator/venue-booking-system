from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet
from .admin_views import booking_stats_view

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    path('stats/', booking_stats_view, name='booking-stats'),
    path('', include(router.urls)),
]
