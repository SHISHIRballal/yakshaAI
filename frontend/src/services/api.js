import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the Render backend.
// In dev, we use '/api' which Vite proxies to localhost:8000.
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yakshaai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yakshaai_token')
    }
    return Promise.reject(error)
  }
)

export default api
