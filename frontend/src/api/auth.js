import api from './axios'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

export const loginUser = (email, password) =>
  axios.post(`${BASE}/auth/login/`, { email, password })

export const registerUser = (data) =>
  axios.post(`${BASE}/auth/register/`, data)

export const logoutUser = (refresh) =>
  api.post('/auth/logout/', { refresh })

export const getProfile = () => api.get('/auth/profile/')
