import api from '../api/axios'

export const PUSH_PERMISSION_EVENT = 'beegarden:push-permission-changed'

export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export const isPushSupported = () =>
  typeof window !== 'undefined'
  && isNotificationSupported()
  && 'serviceWorker' in navigator
  && 'PushManager' in window

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported'

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission

  window.dispatchEvent(new Event(PUSH_PERMISSION_EVENT))
  return permission
}

export const registerPushServiceWorker = async () => {
  if (!isPushSupported()) return null
  return navigator.serviceWorker.register('/sw.js')
}

export const subscribeUserToPush = async (userId, options = {}) => {
  const { forceRefresh = false } = options

  if (!userId || !isPushSupported() || getNotificationPermission() !== 'granted') {
    return false
  }

  const registration = await registerPushServiceWorker()
  if (!registration) return false

  const { data } = await api.get('/api/push/vapid-public-key')
  let existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription && forceRefresh) {
    try {
      await api.delete('/api/push/subscribe', {
        data: {
          user_id: userId,
          subscription: existingSubscription.toJSON(),
        },
      })
    } catch (error) {
      console.error('Push refresh sync error:', error)
    }

    try {
      await existingSubscription.unsubscribe()
    } catch (error) {
      console.error('Push refresh unsubscribe error:', error)
    }

    existingSubscription = null
  }

  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
  })

  await api.post('/api/push/subscribe', {
    user_id: userId,
    subscription: subscription.toJSON(),
  })

  return true
}

export const unsubscribeUserFromPush = async (userId) => {
  if (!userId || !('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()

  if (!subscription) return

  try {
    await api.delete('/api/push/subscribe', {
      data: {
        user_id: userId,
        subscription: subscription.toJSON(),
      },
    })
  } catch (error) {
    console.error('Push unsubscribe sync error:', error)
  }

  try {
    await subscription.unsubscribe()
  } catch (error) {
    console.error('Push unsubscribe browser error:', error)
  }
}

export const sendTestPushNotification = async (userId) => {
  if (!userId) return false

  try {
    await api.post('/api/push/test', {
      user_id: userId,
    })
  } catch (error) {
    console.warn('Push test skipped:', error?.response?.status || error?.message || error)
    return false
  }

  return true
}
