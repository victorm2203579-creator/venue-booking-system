import api from './axios'

export const getAllVenues = (params) => api.get('/venues/', { params })
export const getVenueById = (id) => api.get(`/venues/${id}/`)
export const createVenue = (data) => api.post('/venues/', data)
export const updateVenue = (id, data) => api.patch(`/venues/${id}/`, data)
export const deleteVenue = (id) => api.delete(`/venues/${id}/`)
