# Venue Booking System

A full-stack university venue booking platform built with **Django REST Framework** (backend) and **React 18 + Vite** (frontend). Students and staff can browse venues, submit booking requests, and receive real-time notifications, while administrators can approve or reject requests, manage venues, and view analytics through an interactive dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL |
| CORS | django-cors-headers |
| Config | python-decouple (.env file) |
| Static files | WhiteNoise |
| Production server | Gunicorn |
| Frontend | React 18 + Vite 8 |
| Styling | Tailwind CSS v4 + @tailwindcss/forms |
| Routing | React Router v6 |
| HTTP client | Axios (JWT interceptors + auto-refresh) |
| Charts | Recharts |
| Notifications | react-hot-toast |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL installed and running
- Git (optional)

---

### Step 1 — Clone or unzip the project

```bash
git clone <repo-url>
cd venue_booking_system
```

Or extract the zip and `cd` into the folder.

---

### Step 2 — Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\activate
```

**Mac / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

---

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

### Step 4 — Create the PostgreSQL database

**Windows:**
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE venue_db;"
```

**Mac / Linux:**
```bash
psql -U postgres -c "CREATE DATABASE venue_db;"
```

---

### Step 5 — Configure your .env file

Create a `.env` file in the project root (same folder as `manage.py`):

```env
SECRET_KEY=replace-this-with-a-long-random-string
DEBUG=True
DB_NAME=venue_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

Generate a secret key:
```python
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

### Step 6 — Run database migrations

```bash
python manage.py migrate
```

---

### Step 7 — Seed all demo data (one command)

```bash
python manage.py seed_all
```

This creates:
- 12 university venues
- 4 demo user accounts (admin, 2 students, 1 staff)
- 30 sample bookings with mixed statuses
- Sample notifications for each user

---

### Step 8 — Start the Django server

```bash
python manage.py runserver
```

API runs at: `http://127.0.0.1:8000/`

---

### Step 9 — Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: `http://localhost:5173/`

---

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@university.edu | Admin@1234 |
| Student | john.doe@student.edu | Student@1234 |
| Student | jane.smith@student.edu | Student@1234 |
| Staff | dr.adams@university.edu | Staff@1234 |

Django admin panel: `http://localhost:8000/admin/` (use admin credentials above)

---

## API Endpoints

### Health

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/health/` | None | Health check — returns `{"status":"ok","timestamp":"..."}` |

### Authentication (`/api/auth/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | None | Register a new user |
| POST | `/api/auth/login/` | None | Login — returns access + refresh tokens |
| POST | `/api/auth/logout/` | JWT | Blacklist the refresh token |
| POST | `/api/auth/token/refresh/` | None | Exchange refresh token for new access token |
| GET | `/api/auth/profile/` | JWT | Get logged-in user's profile |

### Venues (`/api/venues/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/venues/` | JWT | List venues (filter: `venue_type`, `is_active`, `min_capacity`, `search`) |
| GET | `/api/venues/<id>/` | JWT | Venue detail |
| POST | `/api/venues/` | Admin | Create venue |
| PATCH | `/api/venues/<id>/` | Admin | Update venue |
| DELETE | `/api/venues/<id>/` | Admin | Soft-deactivate venue |

### Bookings (`/api/bookings/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings/` | JWT | Create booking (status = pending) |
| GET | `/api/bookings/` | JWT | List bookings (students: own; admin: all) — filter: `status`, `date`, `venue_id` |
| GET | `/api/bookings/<id>/` | JWT | Booking detail |
| PATCH | `/api/bookings/<id>/cancel/` | Owner | Cancel a pending or approved booking |
| GET | `/api/bookings/pending/` | Admin | All pending bookings, oldest first |
| PATCH | `/api/bookings/<id>/approve/` | Admin | Approve a pending booking |
| PATCH | `/api/bookings/<id>/reject/` | Admin | Reject a pending booking (requires `rejection_reason`) |
| GET | `/api/bookings/stats/` | Admin | Dashboard stats snapshot |

### Notifications (`/api/notifications/`)

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications/` | JWT | List own notifications |
| PATCH | `/api/notifications/<id>/mark_read/` | JWT | Mark one notification read |
| PATCH | `/api/notifications/mark_all_read/` | JWT | Mark all notifications read |
| GET | `/api/notifications/unread_count/` | JWT | Unread badge count |

### Reports (`/api/reports/`) — Admin only

| Method | URL | Description |
|---|---|---|
| GET | `/api/reports/summary/?period=week` | Booking counts by status. `period`: `today`, `week`, `month` |
| GET | `/api/reports/venue-utilization/` | Per-venue totals, approval rate, utilization % |
| GET | `/api/reports/busiest-slots/` | Approved bookings grouped by start hour (all 24 hours) |
| GET | `/api/reports/monthly-trend/` | Total + approved bookings per month for last 6 months |
| GET | `/api/reports/top-users/` | Top 5 users by approved booking count |

---

## User Roles

| Role | Capabilities |
|---|---|
| `student` | Browse venues, create bookings, view own bookings, receive notifications |
| `staff` | Same as student |
| `admin` | All of the above + approve/reject bookings, manage venues, view analytics |

---

## Management Commands

| Command | Description |
|---|---|
| `python manage.py seed_all` | Full seed: venues + users + bookings + notifications |
| `python manage.py seed_venues` | Seed 12 university venues only |
| `python manage.py seed_bookings` | Seed sample bookings only |
| `python manage.py generate_report` | Print analytics report to terminal (`--period today\|week\|month`) |
| `python manage.py migrate` | Apply all database migrations |
| `python manage.py createsuperuser` | Create a Django superuser manually |

---

## Project Structure

```
venue_booking_system/
├── config/                  # Django project configuration
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── users/                   # Custom user model + JWT auth  →  /api/auth/
├── venues/                  # Venue model, API, seed        →  /api/venues/
├── bookings/                # Bookings, admin workflow,
│   │                          reports, seed                 →  /api/bookings/
│   │                                                           /api/reports/
│   └── management/commands/
│       ├── seed_all.py      # Master seed command
│       ├── seed_bookings.py
│       └── generate_report.py
├── notifications/           # In-app notification system    →  /api/notifications/
├── frontend/                # React 18 + Vite frontend
│   └── src/
│       ├── api/             # Axios helpers for each resource
│       ├── components/      # Layout, ProtectedRoute
│       ├── context/         # AuthContext (global auth state)
│       └── pages/           # All page components
│           └── admin/       # Admin-only pages
├── manage.py
├── requirements.txt
├── Procfile                 # Gunicorn entry point for deployment
└── .env                     # Local secrets (NOT committed)
```

---

## Deployment (Render / Railway / Heroku)

1. Set environment variables on the platform (same keys as `.env`, `DEBUG=False`)
2. Run `python manage.py collectstatic --noinput` during the build step
3. Run `python manage.py migrate` during the build step
4. The `Procfile` starts gunicorn automatically: `web: gunicorn config.wsgi:application`

---

## Screenshots

> _Screenshots will be added here once the UI is deployed._

| Page | Description |
|---|---|
| Login / Register | Public auth screens |
| Student Dashboard | Booking summary cards + recent bookings table |
| Browse Venues | Filterable venue card grid |
| New Booking | Form with inline validation |
| My Bookings | Booking list with cancel action |
| Notifications | Real-time notification feed |
| Admin Dashboard | Stats cards + bar/line charts + hour heatmap |
| Pending Approvals | One-click approve, inline reject form |
| Manage Venues | Add / edit / activate/deactivate venues |
| All Bookings | Full bookings table with CSV export |

---

## Modules

- [x] **Module 1** — Project setup and configuration
- [x] **Module 2** — Custom user model + JWT authentication
- [x] **Module 3** — Venue model, API, filtering, seed data
- [x] **Module 4** — Booking model, conflict detection, capacity enforcement
- [x] **Module 5** — Admin approval/rejection workflow + stats dashboard
- [x] **Module 6** — Notification system (in-app, per-action)
- [x] **Module 7** — Reports & analytics API + terminal report command
- [x] **Module 8** — React 18 frontend (Vite + Tailwind v4 + React Router v6)
- [x] **Module 9** — Core frontend pages (Dashboard, Venues, Bookings, New Booking, Notifications)
- [x] **Module 10** — Admin frontend pages (Dashboard with charts, Pending Approvals, Manage Venues, All Bookings)
- [x] **Module 11** — Master seed, health check, deployment prep, CORS fix
