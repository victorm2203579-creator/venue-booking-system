from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
]

# ---------------------------------------------------------------------------
# Sample request bodies
# ---------------------------------------------------------------------------
#
# POST /api/auth/register/
# {
#     "full_name": "John Doe",
#     "email": "john@example.com",
#     "password": "securepass123",
#     "role": "student",
#     "matric_number": "CSC/2021/001"   <- optional
# }
#
# POST /api/auth/login/
# {
#     "email": "john@example.com",
#     "password": "securepass123"
# }
#
# POST /api/auth/logout/
# Header: Authorization: Bearer <access_token>
# {
#     "refresh": "<refresh_token>"
# }
#
# POST /api/auth/token/refresh/
# {
#     "refresh": "<refresh_token>"
# }
#
# GET /api/auth/profile/
# Header: Authorization: Bearer <access_token>
