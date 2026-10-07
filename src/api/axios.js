import axios from 'axios'

const api = axios.create({
  baseURL: 'https://collablearn-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 180000
})

api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem('collablearn_token')
    : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api