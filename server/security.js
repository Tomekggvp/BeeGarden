import { timingSafeEqual } from 'node:crypto'

export const safeSecretEqual = (provided, expected) => {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const validHiveNumber = (value) =>
  typeof value === 'string' && value.length <= 64 && /^[\p{L}\p{N}_ .-]+$/u.test(value)

// Only browser push providers may receive server-side HTTP requests.
export const validPushEndpoint = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      && (!url.port || url.port === '443') && !url.hash
      && (['fcm.googleapis.com', 'updates.push.services.mozilla.com',
        'updates-autopush.stage.mozaws.net', 'web.push.apple.com'].includes(url.hostname)
        || /^[a-z0-9-]+\.notify\.windows\.com$/.test(url.hostname))
  } catch {
    return false
  }
}

export const validSubscription = (subscription) => {
  if (!validPushEndpoint(subscription?.endpoint)) return false
  const { p256dh, auth } = subscription.keys || {}
  return typeof p256dh === 'string' && /^[\w-]+={0,2}$/.test(p256dh)
    && Buffer.from(p256dh, 'base64url').length === 65
    && typeof auth === 'string' && /^[\w-]+={0,2}$/.test(auth)
    && Buffer.from(auth, 'base64url').length === 16
}

export const authenticate = ({ supabase, createUserClient }) => async (req, res, next) => {
  if (['/health', '/push/vapid-public-key', '/reminders/run'].includes(req.path)) return next()
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')
  if (!match) return res.status(401).json({ error: 'Authentication required' })
  let result
  try {
    result = await supabase.auth.getUser(match[1])
  } catch {
    return res.status(503).json({ error: 'Authentication service unavailable' })
  }
  if (result.error || !result.data?.user) {
    return res.status(401).json({ error: 'Invalid or expired access token' })
  }
  req.user = result.data.user
  for (const claimed of [req.query.user_id, req.body?.user_id]) {
    if (claimed !== undefined && claimed !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  req.db = createUserClient(match[1])
  res.set('Cache-Control', 'no-store')
  next()
}
