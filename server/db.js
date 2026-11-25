import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: {
    fetch: (url, init = {}) => fetch(url, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000),
    }),
  },
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options,
)

// A separate client per request preserves RLS and never shares user sessions.
export const createUserClient = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { ...options, global: { ...options.global, headers: { Authorization: `Bearer ${token}` } } },
)
