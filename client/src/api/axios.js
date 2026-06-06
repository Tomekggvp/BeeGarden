import axios from 'axios'

const fallbackApiBaseUrl = 'https://beegarden.onrender.com'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
