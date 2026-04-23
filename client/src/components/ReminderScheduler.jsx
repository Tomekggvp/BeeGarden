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

    const syncPushSubscription = async () => {
      const permission = getNotificationPermission()

      if (permission === 'granted') {
        try {
          await subscribeUserToPush(userId)
        } catch (error) {
          console.error('Push sync error:', error)
        }
        return
      }

      if (permission === 'denied') {
        try {
          await unsubscribeUserFromPush(userId)
        } catch (error) {
          console.error('Push cleanup error:', error)
        }
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
