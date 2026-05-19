import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Venues from './pages/Venues'
import MyBookings from './pages/MyBookings'
import NewBooking from './pages/NewBooking'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import BookingPass from './pages/BookingPass'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import PendingApprovals from './pages/admin/PendingApprovals'
import ManageVenues from './pages/admin/ManageVenues'
import AllBookings from './pages/admin/AllBookings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All authenticated pages share the Layout shell */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/new" element={<NewBooking />} />
            <Route path="/bookings/:id/pass" element={<BookingPass />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Admin-only */}
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><PendingApprovals /></ProtectedRoute>} />
            <Route path="/admin/venues" element={<ProtectedRoute roles={['admin']}><ManageVenues /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AllBookings /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
