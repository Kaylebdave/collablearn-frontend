import axios from 'axios'

const api = axios.create({
  baseURL: 'https://collablearn-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 180000
})

export default api