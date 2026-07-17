import axios from 'axios'

// In production (Vercel), VITE_API_URL points to your Render backend.
// In development, Vite proxy handles /api → http://127.0.0.1:8000
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL   // e.g. https://yaksha-ai-backend.onrender.com
  : '/api'                          // local dev via Vite proxy

const api = axios.create({
  baseURL,
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
