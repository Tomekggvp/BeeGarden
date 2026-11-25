import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { DATA_TABLES, dispatchDataChange } from '../lib/liveEvents'

export default function AccountLiveSync({ userId }) {
  useEffect(() => {
    if (!userId) return undefined
    let timer
    let stopped = false
    const pending = new Set()
    const flush = () => {
      timer = undefined
      if (stopped) return
      for (const table of pending) dispatchDataChange(userId, table)
      pending.clear()
    }
    const queue = (table = '*') => {
      pending.add(table)
      if (!timer) timer = setTimeout(flush, 120)
    }
    const channel = supabase.channel(`account:${userId}`, { config: { private: true } })
      .on('broadcast', { event: 'data_changed' }, ({ payload }) => {
        if (DATA_TABLES.includes(payload?.table)) queue(payload.table)
      }).subscribe((status) => { if (status === 'SUBSCRIBED') queue() })
    const resume = () => { if (document.visibilityState === 'visible') queue() }
    window.addEventListener('online', resume)
    document.addEventListener('visibilitychange', resume)
    // Also catches missed messages after prolonged mobile sleep/network failure.
    const fallback = setInterval(() => { if (document.visibilityState === 'visible') queue() }, 60000)
    return () => {
      stopped = true
      clearTimeout(timer)
      clearInterval(fallback)
      window.removeEventListener('online', resume)
      document.removeEventListener('visibilitychange', resume)
      supabase.removeChannel(channel)
    }
  }, [userId])
  return null
}
