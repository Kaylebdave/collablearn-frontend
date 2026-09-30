import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '')

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
})

export default api
