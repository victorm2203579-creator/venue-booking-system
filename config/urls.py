from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.utils import timezone


def health_check(request):
    return JsonResponse({'status': 'ok', 'timestamp': timezone.now().isoformat()})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('users.urls')),
    path('api/venues/', include('venues.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('bookings.report_urls')),
]
