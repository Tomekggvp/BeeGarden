import express from 'express'
import cors from 'cors'
import webpush from 'web-push'
import { supabase } from './db.js'

const app = express()
const hivesCache = new Map()
const HIVES_CACHE_TTL_MS = 30_000
const REMINDER_CHECK_INTERVAL_MS = 30_000
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:beegarden@example.com'
const reminderCronSecret = String(process.env.REMINDER_CRON_SECRET || '').trim()

const pushEnabled = Boolean(vapidPublicKey && vapidPrivateKey)
let remindersCheckInProgress = false

if (pushEnabled) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
} else {
  console.warn('Push notifications disabled: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required')
}

app.disable('x-powered-by')
app.use(cors())
app.use(express.json())

const getUserId = (value) => String(value || '').trim()
const getHiveNumber = (value) => String(value || '').trim()
const getSubscriptionEndpoint = (subscription) => String(subscription?.endpoint || '').trim()

const getCachedHives = (userId) => {
  const cached = hivesCache.get(userId)

  if (!cached) return null
  if (Date.now() - cached.createdAt > HIVES_CACHE_TTL_MS) {
    hivesCache.delete(userId)
    return null
  }

  return cached.data
}

const setCachedHives = (userId, data) => {
  hivesCache.set(userId, {
    createdAt: Date.now(),
    data,
  })
}

const clearCachedHives = (userId) => {
  hivesCache.delete(userId)
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/push/vapid-public-key', (_req, res) => {
  if (!pushEnabled) {
    return res.status(503).json({ error: 'Push notifications are not configured' })
  }

  res.json({ publicKey: vapidPublicKey })
})

app.post('/api/push/subscribe', async (req, res) => {
  if (!pushEnabled) {
    return res.status(503).json({ error: 'Push notifications are not configured' })
  }

  const userId = getUserId(req.body.user_id)
  const subscription = req.body.subscription
  const endpoint = getSubscriptionEndpoint(subscription)

  if (!userId || !endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'user_id and a valid push subscription are required' })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' })

  if (error) return res.status(400).json({ error: error.message })

  res.json({ success: true })
})

app.delete('/api/push/subscribe', async (req, res) => {
  const userId = getUserId(req.body.user_id)
  const endpoint = getSubscriptionEndpoint(req.body.subscription)

  if (!userId || !endpoint) {
    return res.status(400).json({ error: 'user_id and subscription endpoint are required' })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) return res.status(400).json({ error: error.message })

  res.json({ success: true })
})

app.post('/api/check-notifications/send', async (req, res) => {
  if (!pushEnabled) {
    return res.status(503).json({ error: 'Push notifications are not configured' })
  }

  const userId = getUserId(req.body.user_id)
  const hiveId = getHiveNumber(req.body.hive_id)
  const kind = String(req.body.kind || '').trim()

  if (!userId || !hiveId || (kind !== 'pumping' && kind !== 'treatment')) {
    return res.status(400).json({ error: 'user_id, hive_id and kind(pumping|treatment) are required' })
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('push_subscriptions')
    .select('endpoint,subscription')
    .eq('user_id', userId)

  if (subscriptionsError) {
    return res.status(500).json({ error: subscriptionsError.message })
  }

  if (!subscriptions?.length) {
    return res.json({ sent: false, reason: 'no_subscriptions' })
  }

  const messageByKind = {
    pumping: 'откачать мёд',
    treatment: 'нужно лечение',
  }

  const urlByKind = {
    pumping: '/pumping',
    treatment: '/treatment',
  }

  const sent = await sendPushPayload(subscriptions, {
    title: `Улей №${hiveId}`,
    hiveId,
    body: messageByKind[kind],
    icon: '/bee.png',
    tag: `beegarden-check-${kind}-${hiveId}`,
    url: urlByKind[kind],
  })

  res.json({ sent })
})

app.post('/api/reminders/run', async (req, res) => {
  if (!reminderCronSecret) {
    return res.status(503).json({ error: 'REMINDER_CRON_SECRET is not configured' })
  }

  const providedSecret = String(req.headers['x-reminder-secret'] || '').trim()
  if (providedSecret !== reminderCronSecret) {
    return res.status(401).json({ error: 'Invalid reminder secret' })
  }

  const result = await checkDueReminders()
  res.json(result)
})

app.get('/api/hives', async (req, res) => {
  const userId = getUserId(req.query.user_id)

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' })
  }

  const cachedHives = getCachedHives(userId)
  if (cachedHives) {
    res.set('X-Cache', 'HIT')
    return res.json(cachedHives)
  }

  const { data, error } = await supabase
    .from('hives')
    .select('hive_number,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const hives = data || []
  setCachedHives(userId, hives)
  res.set('X-Cache', 'MISS')
  res.json(hives)
})

app.post('/api/hives', async (req, res) => {
  const userId = getUserId(req.body.user_id)
  const hiveNumber = getHiveNumber(req.body.hive_number)

  if (!userId || !hiveNumber) {
    return res.status(400).json({ error: 'user_id and hive_number are required' })
  }

  const { data, error } = await supabase
    .from('hives')
    .insert([{ user_id: userId, hive_number: hiveNumber }])
    .select('hive_number,created_at')
    .single()

  if (error) return res.status(400).json({ error: error.message })

  clearCachedHives(userId)
  res.json(data)
})

app.delete('/api/hives/:hive_number', async (req, res) => {
  const hiveNumber = getHiveNumber(req.params.hive_number)
  const userId = getUserId(req.query.user_id)

  if (!userId || !hiveNumber) {
    return res.status(400).json({ error: 'user_id and hive_number are required' })
  }

  const { error } = await supabase
    .from('hives')
    .delete()
    .eq('hive_number', hiveNumber)
    .eq('user_id', userId)

  if (error) return res.status(400).json({ error: error.message })

  clearCachedHives(userId)
  res.json({ success: true })
})

app.get('/api/beehive/:id', async (req, res) => {
  const id = getHiveNumber(req.params.id)
  const userId = getUserId(req.query.user_id)

  if (!userId || !id) {
    return res.status(400).json({ error: 'user_id and hive id are required' })
  }

  const { data, error } = await supabase
    .from('beehive_details')
    .select('*')
    .eq('hive_id', id)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
  res.json(data || {})
})

app.post('/api/beehive', async (req, res) => {
  const { breed, swarms, install_date } = req.body
  const hiveId = getHiveNumber(req.body.hive_id)
  const userId = getUserId(req.body.user_id)

  if (!userId || !hiveId) {
    return res.status(400).json({ error: 'user_id and hive_id are required' })
  }

  const { error } = await supabase
    .from('beehive_details')
    .upsert({
      hive_id: hiveId,
      user_id: userId,
      breed,
      swarms: parseInt(swarms, 10) || 0,
      install_date,
    }, { onConflict: 'hive_id,user_id' })

  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

const deleteExpiredSubscription = async (endpoint) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) {
    console.error('Push subscription cleanup error:', error.message)
  }
}

const sendPushPayload = async (subscriptions, payloadData) => {
  const payload = JSON.stringify(payloadData)
  const results = await Promise.allSettled(
    subscriptions.map((item) => webpush.sendNotification(item.subscription, payload, {
      TTL: 60,
      urgency: 'high',
    }))
  )

  await Promise.all(results.map((result, index) => {
    if (result.status !== 'rejected') return Promise.resolve()

    const statusCode = result.reason?.statusCode
    if (statusCode === 404 || statusCode === 410) {
      return deleteExpiredSubscription(subscriptions[index].endpoint)
    }

    console.error('Push notification error:', result.reason?.message || result.reason)
    return Promise.resolve()
  }))

  return results.some((result) => result.status === 'fulfilled')
}

const sendReminderPushes = async (task, subscriptions) =>
  sendPushPayload(subscriptions, {
    title: `Улей №${task.hive_id}`,
    taskText: task.task_text,
    reminderAt: task.reminder_at,
    icon: '/bee.png',
    tag: `beegarden-task-${task.id}`,
    url: '/tasks',
  })

const storeReminderHistory = async (task, deliveredAt) => {
  const { error } = await supabase
    .from('task_notification_history')
    .upsert({
      user_id: String(task.user_id),
      task_id: task.id,
      hive_id: String(task.hive_id),
      task_text: task.task_text,
      reminder_at: task.reminder_at,
      delivered_at: deliveredAt,
    }, { onConflict: 'user_id,task_id' })

  if (error) {
    console.error('Reminder history save error:', error.message)
  }
}

const checkDueReminders = async () => {
  if (!pushEnabled) {
    return { status: 'disabled', matched: 0, sent: 0 }
  }

  if (remindersCheckInProgress) {
    return { status: 'busy', matched: 0, sent: 0 }
  }

  remindersCheckInProgress = true

  const now = new Date().toISOString()
  const { data: dueTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id,user_id,hive_id,task_text,reminder_at')
    .eq('reminder_enabled', true)
    .is('reminder_notified_at', null)
    .lte('reminder_at', now)
    .order('reminder_at', { ascending: true })
    .limit(25)

  if (tasksError) {
    console.error('Reminder query error:', tasksError.message)
    remindersCheckInProgress = false
    return { status: 'error', matched: 0, sent: 0, error: tasksError.message }
  }

  let sentCount = 0

  try {
    for (const task of dueTasks || []) {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('push_subscriptions')
        .select('endpoint,subscription')
        .eq('user_id', String(task.user_id))

      if (subscriptionsError) {
        console.error('Push subscriptions query error:', subscriptionsError.message)
        continue
      }

      if (!subscriptions?.length) continue

      const sent = await sendReminderPushes(task, subscriptions)
      if (!sent) continue

      sentCount += 1

      await storeReminderHistory(task, now)

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ reminder_notified_at: now })
        .eq('id', task.id)
        .eq('user_id', task.user_id)
        .is('reminder_notified_at', null)

      if (updateError) {
        console.error('Reminder mark sent error:', updateError.message)
      }
    }
  } finally {
    remindersCheckInProgress = false
  }

  return {
    status: 'ok',
    matched: (dueTasks || []).length,
    sent: sentCount,
  }
}

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`)

  if (pushEnabled) {
    checkDueReminders()
    setInterval(checkDueReminders, REMINDER_CHECK_INTERVAL_MS)
  }
})
