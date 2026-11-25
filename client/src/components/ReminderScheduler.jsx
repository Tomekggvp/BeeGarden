import { useEffect } from 'react'
import {
  PUSH_PERMISSION_EVENT,
  getNotificationPermission,
  isPushSupported,
  registerPushServiceWorker,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../lib/pushNotifications'

const ReminderScheduler = ({ session }) => {
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !isPushSupported()) return undefined

    let isMounted = true
    let syncing = false
    let lastSyncAt = 0
    let lastPermission = null

    const syncPushSubscription = async () => {
      if (!isMounted || syncing) return
      const permission = getNotificationPermission()
      if (permission === lastPermission && Date.now() - lastSyncAt < 5 * 60_000) return
      syncing = true
      try {
        if (permission === 'granted') {
          await subscribeUserToPush(userId)
        }
        if (permission === 'denied') {
          await unsubscribeUserFromPush(userId)
        }
        lastSyncAt = Date.now()
        lastPermission = permission
      } catch (error) {
        console.error('Push sync error:', error)
      } finally {
        syncing = false
      }
    }

    registerPushServiceWorker()
      .then(() => {
        if (isMounted) {
          return syncPushSubscription()
        }

        return undefined
      })
      .catch((error) => {
        console.error('Service worker register error:', error)
      })

    const handlePermissionChange = () => {
      syncPushSubscription()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPushSubscription()
      }
    }

    window.addEventListener(PUSH_PERMISSION_EVENT, handlePermissionChange)
    window.addEventListener('focus', handlePermissionChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.removeEventListener(PUSH_PERMISSION_EVENT, handlePermissionChange)
      window.removeEventListener('focus', handlePermissionChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.id])

  return null
}

export default ReminderScheduler
