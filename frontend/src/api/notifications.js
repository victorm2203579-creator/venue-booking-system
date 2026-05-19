import api from './axios'

export const getNotifications = () => api.get('/notifications/')
export const markRead = (id) => api.patch(`/notifications/${id}/mark_read/`)
export const markAllRead = () => api.patch('/notifications/mark_all_read/')
export const getUnreadCount = () => api.get('/notifications/unread_count/')
