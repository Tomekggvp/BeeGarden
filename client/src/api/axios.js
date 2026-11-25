import axios from 'axios'
import { supabase } from '../services/supabaseClient'

const fallbackApiBaseUrl = 'https://beegarden.onrender.com'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (session?.access_token) config.headers.set('Authorization', `Bearer ${session.access_token}`)
  return config
})

export default api
