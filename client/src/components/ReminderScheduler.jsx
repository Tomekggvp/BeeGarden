import { useEffect } from 'react'
import api from '../api/axios'
import { supabase } from '../services/supabaseClient'

const REMINDER_CHECK_INTERVAL = 30000

const canUseNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'

const canUsePush = () =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && canUseNotifications()

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

const showReminderNotification = (task) => {
  try {
    new Notification(`BeeGarden: улей №${task.hive_id}`, {
      body: task.task_text,
      icon: '/bee.png',
      tag: `beegarden-task-${task.id}`,
      renotify: true,
    })
  } catch (err) {
    console.error('Notification error:', err)
  }
}

const subscribeToPush = async (userId) => {
  if (!canUsePush()) return false

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    const existingSubscription = await registration.pushManager.getSubscription()
    const { data } = await api.get('/api/push/vapid-public-key')

    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    })

    await api.post('/api/push/subscribe', {
      user_id: userId,
      subscription: subscription.toJSON(),
    })

    return true
  } catch (err) {
    console.error('Push subscribe error:', err)
    return false
  }
}

const ReminderScheduler = ({ session }) => {
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return undefined

    let isChecking = false
    let isMounted = true
    let pushSubscribed = false

    const ensurePushSubscription = async () => {
      pushSubscribed = await subscribeToPush(userId)
    }

    const checkRemindersInOpenApp = async () => {
      if (isChecking || pushSubscribed || !canUseNotifications()) return

      isChecking = true
      const now = new Date().toISOString()

      const { data: dueTasks, error: loadError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('reminder_enabled', true)
        .is('reminder_notified_at', null)
        .lte('reminder_at', now)
        .limit(10)

      if (loadError) {
        console.error('Reminder load error:', loadError)
        isChecking = false
        return
      }

      const dueTaskIds = (dueTasks || []).map((task) => task.id)
      if (dueTaskIds.length === 0) {
        isChecking = false
        return
      }

      const { data: claimedTasks, error: updateError } = await supabase
        .from('tasks')
        .update({ reminder_notified_at: now })
        .eq('user_id', userId)
        .is('reminder_notified_at', null)
        .in('id', dueTaskIds)
        .select('id,hive_id,task_text,reminder_at')

      if (updateError) {
        console.error('Reminder update error:', updateError)
        isChecking = false
        return
      }

      if (isMounted) {
        const remindersToShow = claimedTasks || []
        remindersToShow.forEach(showReminderNotification)
      }

      isChecking = false
    }

    ensurePushSubscription().then(checkRemindersInOpenApp)
    const intervalId = window.setInterval(checkRemindersInOpenApp, REMINDER_CHECK_INTERVAL)

    const handleNotificationPermissionChanged = () => {
      ensurePushSubscription()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensurePushSubscription().then(checkRemindersInOpenApp)
      }
    }

    window.addEventListener('focus', checkRemindersInOpenApp)
    window.addEventListener('beegarden:notifications-permission-changed', handleNotificationPermissionChanged)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', checkRemindersInOpenApp)
      window.removeEventListener('beegarden:notifications-permission-changed', handleNotificationPermissionChanged)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.id])

  return null
}

export default ReminderScheduler
