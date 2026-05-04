import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import TaskNotificationsModal from './TaskNotificationsModal'
import { MENU_VISIBILITY_EVENT } from '../componentsMUI/TemporaryDrawer'

const buildStorageKey = (userId) => `beegarden:notifications:lastSeenAt:${userId}`

const readLastSeenAt = (userId) => {
  try {
    const raw = localStorage.getItem(buildStorageKey(userId))
    return raw ? new Date(raw).toISOString() : null
  } catch {
    return null
  }
}

const writeLastSeenAt = (userId, value) => {
  try {
    localStorage.setItem(buildStorageKey(userId), value)
  } catch {
    // ignore
  }
}

const GlobalNotificationsBell = ({ session }) => {
  const userId = session?.user?.id || ''
  const [isOpen, setIsOpen] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [lastSeenByUser, setLastSeenByUser] = useState({})
  const lastSeenAt = userId
    ? (lastSeenByUser[userId] ?? readLastSeenAt(userId))
    : null

  useEffect(() => {
    if (!userId) return

    const loadHasNew = async () => {
      const seenAt = readLastSeenAt(userId)

      const query = supabase
        .from('task_notification_history')
        .select('id,delivered_at')
        .eq('user_id', userId)
        .order('delivered_at', { ascending: false })
        .limit(1)

      const { data, error } = await query
      if (error) {
        console.error('Load global notification state error:', error)
        return
      }

      const latest = data?.[0]
      if (!latest?.delivered_at) {
        setHasNew(false)
        return
      }

      if (!seenAt) {
        setHasNew(true)
        return
      }

      setHasNew(new Date(latest.delivered_at).getTime() > new Date(seenAt).getTime())
    }

    loadHasNew()
  }, [userId, lastSeenAt])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`task-notification-history-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'task_notification_history',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (isOpen) return

        const deliveredAt = payload?.new?.delivered_at
        if (!deliveredAt) {
          setHasNew(true)
          return
        }

        if (!lastSeenAt) {
          setHasNew(true)
          return
        }

        const isNew = new Date(deliveredAt).getTime() > new Date(lastSeenAt).getTime()
        if (isNew) setHasNew(true)
      })
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (err) {
        console.error('Global notifications unsubscribe error:', err)
      }
    }
  }, [isOpen, lastSeenAt, userId])

  useEffect(() => {
    const handler = (event) => {
      setIsHidden(Boolean(event?.detail?.open))
    }

    window.addEventListener(MENU_VISIBILITY_EVENT, handler)
    return () => window.removeEventListener(MENU_VISIBILITY_EVENT, handler)
  }, [])

  const handleOpen = () => {
    if (!userId) return
    const now = new Date().toISOString()
    setIsOpen(true)
    setHasNew(false)
    writeLastSeenAt(userId, now)
    setLastSeenByUser((currentState) => ({
      ...currentState,
      [userId]: now,
    }))
  }

  const handleClose = () => setIsOpen(false)

  if (!userId) return null
  if (isHidden) return null

  return (
    <>
      <div className="fixed right-4 top-4 z-[1200] sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={handleOpen}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f1d88a] bg-[#fffaf0]/95 text-[#8b4f00] shadow-sm backdrop-blur transition-colors hover:bg-[#fff4cc]"
          aria-label="Открыть историю уведомлений"
        >
          <Bell size={20} />
          {hasNew && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#fffaf0]" />
          )}
        </button>
      </div>

      <TaskNotificationsModal
        isOpen={isOpen}
        onClose={handleClose}
        session={session}
      />
    </>
  )
}

export default GlobalNotificationsBell
