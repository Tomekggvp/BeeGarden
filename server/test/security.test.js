import test from 'node:test'
import assert from 'node:assert/strict'
import webpush from 'web-push'
import { createApp } from '../app.js'
import { validPushEndpoint, validSubscription, safeSecretEqual } from '../security.js'

const userId = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'
const keys = webpush.generateVAPIDKeys()
process.env.VAPID_PUBLIC_KEY = keys.publicKey
process.env.VAPID_PRIVATE_KEY = keys.privateKey
process.env.REMINDER_CRON_SECRET = 'test-only-cron-secret'

const fixture = async (options = {}) => {
  const queries = []
  const db = {
    from(table) {
      const query = { table, operations: [] }
      queries.push(query)
      const chain = new Proxy({}, {
        get(_target, method) {
          if (method === 'then') return (resolve, reject) => Promise.resolve({ data: options.rows?.[table] ?? [], error: null }).then(resolve, reject)
          return (...args) => { query.operations.push([method, ...args]); return chain }
        },
      })
      return chain
    },
    auth: { getUser: async (token) => token === 'valid-token'
      ? { data: { user: { id: userId } } }
      : { data: { user: null }, error: new Error('invalid token') } },
  }
  const appState = createApp({ supabase: db, createUserClient: (token) => {
    assert.equal(token, 'valid-token')
    return db
  }, ...options })
  const server = appState.app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const request = (path, init = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    ...init,
    headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json', ...init.headers },
  })
  return { ...appState, queries, request, close: () => new Promise((resolve) => server.close(resolve)) }
}

test('all data and push endpoints require authentication before database access', async () => {
  const f = await fixture()
  try {
    for (const [method, path] of [
      ['GET', '/api/hives'], ['POST', '/api/hives'], ['DELETE', '/api/hives/1'],
      ['GET', '/api/beehive/1'], ['POST', '/api/beehive'],
      ['POST', '/api/push/subscribe'], ['DELETE', '/api/push/subscribe'],
      ['POST', '/api/check-notifications/send'], ['GET', '/api/weather/location'],
      ['PATCH', '/api/hives/1/apiary'],
    ]) {
      for (const authorization of ['', 'Bearer forged-token']) {
        const response = await f.request(path, { method, headers: { Authorization: authorization } })
        assert.equal(response.status, 401, `${method} ${path}`)
      }
    }
    assert.equal(f.queries.length, 0)
  } finally { await f.close() }
})

test('rejects another user in either query or body, including deletes and push writes', async () => {
  const f = await fixture()
  try {
    for (const [method, path] of [
      ['GET', '/api/hives'], ['DELETE', '/api/hives/1'], ['GET', '/api/beehive/1'],
      ['POST', '/api/hives'], ['POST', '/api/beehive'], ['POST', '/api/push/subscribe'],
      ['DELETE', '/api/push/subscribe'], ['POST', '/api/check-notifications/send'],
    ]) {
      const response = await f.request(`${path}?user_id=${otherId}`, {
        method, ...(method === 'POST' ? { body: JSON.stringify({ user_id: otherId }) } : {}),
      })
      assert.equal(response.status, 403, `${method} ${path}`)
    }
    const response = await f.request('/api/hives', { method: 'POST', body: JSON.stringify({ user_id: otherId, hive_number: '1' }) })
    assert.equal(response.status, 403)
    assert.equal(f.queries.length, 0)
  } finally { await f.close() }
})

test('reads and mutations derive ownership from verified identity', async () => {
  const f = await fixture()
  try {
    assert.equal((await f.request('/api/hives')).status, 200)
    assert.equal((await f.request('/api/hives', { method: 'POST', body: JSON.stringify({ hive_number: '1' }) })).status, 200)
    assert.equal((await f.request('/api/hives/1', { method: 'DELETE' })).status, 200)
    assert.ok(f.queries[0].operations.some(([method, column, value]) => method === 'eq' && column === 'user_id' && value === userId))
    assert.deepEqual(f.queries[1].operations.find(([method]) => method === 'insert')[1], [{ user_id: userId, hive_number: '1' }])
    assert.ok(f.queries[2].operations.some(([method, column, value]) => method === 'eq' && column === 'user_id' && value === userId))
  } finally { await f.close() }
})

test('rejects invalid inputs, malformed and oversized JSON without leaking stack traces', async () => {
  const f = await fixture()
  try {
    for (const body of [{ hive_number: 'x'.repeat(65) }, { hive_number: '<script>' }, {}]) {
      assert.equal((await f.request('/api/hives', { method: 'POST', body: JSON.stringify(body) })).status, 400)
    }
    for (const details of [{ swarms: -1 }, { swarms: 1.5 }, { install_date: '2026-02-30' }]) {
      assert.equal((await f.request('/api/beehive', { method: 'POST', body: JSON.stringify({ hive_id: '1', ...details }) })).status, 400)
    }
    assert.equal((await f.request('/api/hives', { method: 'POST', body: '[]' })).status, 400)
    assert.equal((await f.request('/api/hives', { method: 'POST', body: '{' })).status, 400)
    const oversized = await f.request('/api/hives', { method: 'POST', body: JSON.stringify({ value: 'x'.repeat(40_000) }) })
    assert.equal(oversized.status, 413)
    assert.equal((await oversized.json()).stack, undefined)
    assert.equal(f.queries.length, 0)
  } finally { await f.close() }
})

test('validates weather coordinates and coalesces/caches identical requests', async () => {
  let calls = 0
  const f = await fixture({ fetchWeather: async (_url, options) => {
    calls += 1
    assert.ok(options.signal)
    return Response.json({ current: { temperature_2m: 12 } })
  } })
  try {
    for (const query of ['', '?latitude=&longitude=0', '?latitude=91&longitude=0', '?latitude=0&longitude=181', '?latitude=x&longitude=0']) {
      assert.equal((await f.request(`/api/weather/location${query}`)).status, 400)
    }
    const results = await Promise.all(Array.from({ length: 5 }, () => f.request('/api/weather/location?latitude=0&longitude=0')))
    assert.ok(results.every((r) => r.status === 200))
    assert.equal(calls, 1)
    await f.request('/api/weather/location?latitude=0&longitude=0')
    assert.equal(calls, 1)
  } finally { await f.close() }
})

test('weather upstream errors are sanitized and retried after failures', async () => {
  let calls = 0
  const f = await fixture({ fetchWeather: async () => { calls++; return new Response('private upstream details', { status: 500 }) } })
  try {
    for (let i = 0; i < 2; i++) {
      const r = await f.request('/api/weather/location?latitude=1&longitude=1')
      assert.equal(r.status, 502)
      assert.equal((await r.text()).includes('private'), false)
    }
    assert.equal(calls, 2)
  } finally { await f.close() }
})

test('push SSRF guard rejects local, arbitrary, credentialed and nonstandard endpoints', () => {
  for (const endpoint of [
    'http://fcm.googleapis.com/send', 'https://127.0.0.1/', 'https://169.254.169.254/',
    'https://internal.example/', 'https://fcm.googleapis.com.attacker.test/',
    'https://user:password@fcm.googleapis.com/', 'https://fcm.googleapis.com:8443/',
  ]) assert.equal(validPushEndpoint(endpoint), false, endpoint)
  assert.equal(validPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true)
  assert.equal(validSubscription({ endpoint: 'https://fcm.googleapis.com/send', keys: { p256dh: 'a', auth: 'a' } }), false)
  assert.equal(validSubscription({ endpoint: 'https://fcm.googleapis.com/send', keys: {
    p256dh: Buffer.alloc(65).toString('base64url'), auth: Buffer.alloc(16).toString('base64url'),
  } }), true)
})

test('cron secret is independent of user login and does not accept missing/incorrect secrets', async () => {
  const f = await fixture()
  try {
    for (const value of ['', 'bad']) {
      assert.equal((await f.request('/api/reminders/run', { method: 'POST', headers: { Authorization: '', 'x-reminder-secret': value } })).status, 401)
    }
    assert.equal((await f.request('/api/reminders/run', { method: 'POST', headers: { Authorization: '', 'x-reminder-secret': process.env.REMINDER_CRON_SECRET } })).status, 200)
    assert.equal(safeSecretEqual('abc', 'abc'), true)
    assert.equal(safeSecretEqual('abc', 'abcd'), false)
  } finally { await f.close() }
})

test('security headers and CORS allow only configured browser origins', async () => {
  const f = await fixture()
  try {
    const r = await f.request('/api/health', { headers: { Authorization: '', Origin: 'https://attacker.test' } })
    assert.equal(r.status, 200)
    assert.equal(r.headers.get('access-control-allow-origin'), null)
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(r.headers.get('x-powered-by'), null)
    const allowed = await f.request('/api/health', { headers: { Origin: 'https://beegardenns.netlify.app' } })
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://beegardenns.netlify.app')
  } finally { await f.close() }
})

test('scheduler lock is released after a thrown database failure', async () => {
  let calls = 0
  const f = await fixture({ supabase: { from() { calls++; throw new Error('db unavailable') } } })
  try {
    await assert.rejects(f.checkDueReminders(), /db unavailable/)
    await assert.rejects(f.checkDueReminders(), /db unavailable/)
    assert.equal(calls, 2)
  } finally { await f.close() }
})

test('push subscription SSRF is rejected before persistence and send requests are throttled', async () => {
  const f = await fixture()
  try {
    assert.equal((await f.request('/api/push/subscribe', {
      method: 'POST', body: JSON.stringify({ subscription: { endpoint: 'https://127.0.0.1/' } }),
    })).status, 400)
    for (let i = 0; i < 10; i++) {
      assert.equal((await f.request('/api/check-notifications/send', { method: 'POST', body: '{}' })).status, 400)
    }
    const limited = await f.request('/api/check-notifications/send', { method: 'POST', body: '{}' })
    assert.equal(limited.status, 429)
    assert.ok(limited.headers.get('retry-after'))
    assert.equal(f.queries.length, 0)
  } finally { await f.close() }
})

test('scheduler fetches subscriptions once per batch and delivers only to each task owner', async () => {
  const operations = []
  const sentTo = []
  const tasks = [userId, userId, otherId].map((owner, i) => ({ id: String(i), user_id: owner, hive_id: '1', task_text: `task-${i}` }))
  const subscriptions = [userId, otherId].map((owner) => ({ user_id: owner, endpoint: `https://fcm.googleapis.com/${owner}`, subscription: { endpoint: `https://fcm.googleapis.com/${owner}` } }))
  const db = {
    from(table) {
      const op = { table, methods: [] }
      operations.push(op)
      const chain = new Proxy({}, { get(_target, method) {
        if (method === 'then') return (resolve, reject) => Promise.resolve({ error: null,
          data: table === 'push_subscriptions' ? subscriptions : op.methods.includes('select') ? tasks : null,
        }).then(resolve, reject)
        return (..._args) => { op.methods.push(method); return chain }
      } })
      return chain
    },
  }
  const f = await fixture({ supabase: db, sendNotification: async (subscription, payload, options) => {
    sentTo.push({ endpoint: subscription.endpoint, task: JSON.parse(payload).taskText })
    assert.equal(options.timeout, 10000)
  } })
  try {
    assert.deepEqual(await f.checkDueReminders(), { status: 'ok', matched: 3, sent: 3 })
    assert.equal(operations.filter((op) => op.table === 'push_subscriptions').length, 1)
    assert.equal(sentTo.length, 3)
    assert.ok(sentTo.slice(0, 2).every((sent) => sent.endpoint.endsWith(userId)))
    assert.ok(sentTo[2].endpoint.endsWith(otherId))
    assert.equal(operations.filter((op) => op.table === 'tasks' && op.methods.includes('update')).length, 3)
  } finally { await f.close() }
})

test('hive transfers require an owned destination and preserve the hive number', async () => {
  const apiaryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const f = await fixture({ rows: { apiaries: { id: apiaryId }, hives: { hive_number: '1', apiary_id: apiaryId } } })
  try {
    const response = await f.request('/api/hives/1/apiary', { method: 'PATCH', body: JSON.stringify({ apiary_id: apiaryId }) })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).hive_number, '1')
    for (const query of f.queries) {
      assert.ok(query.operations.some(([method, column, value]) => method === 'eq' && column === 'user_id' && value === userId))
    }
    const update = f.queries.find((query) => query.table === 'hives').operations.find(([method]) => method === 'update')
    assert.deepEqual(update[1], { apiary_id: apiaryId })
  } finally { await f.close() }
  const denied = await fixture({ rows: { apiaries: null } })
  try {
    for (const [method, path, body] of [
      ['PATCH', '/api/hives/1/apiary', { apiary_id: apiaryId }],
      ['POST', '/api/hives', { hive_number: '1', apiary_id: apiaryId }],
    ]) {
      assert.equal((await denied.request(path, { method, body: JSON.stringify(body) })).status, 404)
    }
    assert.ok(denied.queries.every((query) => query.table === 'apiaries'))
    assert.equal((await denied.request('/api/hives/1/apiary', { method: 'PATCH', body: JSON.stringify({ apiary_id: '../other' }) })).status, 400)
  } finally { await denied.close() }
})

test('new hive insertion includes its selected apiary without changing its number', async () => {
  const apiaryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const f = await fixture({ rows: { apiaries: { id: apiaryId } } })
  try {
    assert.equal((await f.request('/api/hives', { method: 'POST', body: JSON.stringify({ hive_number: '42', apiary_id: apiaryId }) })).status, 200)
    assert.deepEqual(f.queries.find((query) => query.table === 'hives').operations.find(([method]) => method === 'insert')[1],
      [{ user_id: userId, hive_number: '42', apiary_id: apiaryId }])
  } finally { await f.close() }
})
