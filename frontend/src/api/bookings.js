import api from './axios'

export const getBookings = (params) => api.get('/bookings/', { params })
export const getBookingById = (id) => api.get(`/bookings/${id}/`)
export const createBooking = (data) => api.post('/bookings/', data)
export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel/`)
export const getPendingBookings = () => api.get('/bookings/pending/')
export const approveBooking = (id) => api.patch(`/bookings/${id}/approve/`)
export const rejectBooking = (id, rejection_reason) =>
  api.patch(`/bookings/${id}/reject/`, { rejection_reason })
export const getBookingStats = () => api.get('/bookings/stats/')
