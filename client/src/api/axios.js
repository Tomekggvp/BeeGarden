import axios from 'axios'
import { supabase } from '../services/supabaseClient'
import { installAuthInterceptors } from './auth'

const fallbackApiBaseUrl = 'https://beegarden.onrender.com'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

installAuthInterceptors(api, supabase.auth)

export default api
