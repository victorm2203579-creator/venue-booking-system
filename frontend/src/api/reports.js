import api from './axios'

export const getReportSummary = (period = 'week') =>
  api.get('/reports/summary/', { params: { period } })

export const getVenueUtilization = () => api.get('/reports/venue-utilization/')

export const getBusiestSlots = () => api.get('/reports/busiest-slots/')

export const getMonthlyTrend = () => api.get('/reports/monthly-trend/')

export const getTopUsers = (limit = 5) =>
  api.get('/reports/top-users/', { params: { limit } })
