// Development-only fixture. Vite aliases use this module only with APIARY_PREVIEW=1.
export const PREVIEW_USER_ID = '00000000-0000-4000-8000-000000000001'
const KEY = 'beegarden:apiary-preview:data:v1'
const firstId = '00000000-0000-4000-8000-000000000101'
const secondId = '00000000-0000-4000-8000-000000000102'
const now = new Date().toISOString()
const initial = () => ({
  apiaries: [
    { id: firstId, user_id: PREVIEW_USER_ID, name: 'Основная пасека', is_default: true, latitude: 53.9006, longitude: 27.559, saved_at: now, created_at: now },
    { id: secondId, user_id: PREVIEW_USER_ID, name: 'Выездная пасека', is_default: false, latitude: 52.0976, longitude: 23.7341, saved_at: now, created_at: now },
  ],
  hives: ['1', '2', '3'].map((number, index) => ({ id: crypto.randomUUID(), user_id: PREVIEW_USER_ID, hive_number: number, apiary_id: index === 2 ? secondId : firstId, created_at: now })),
  beehive_details: [], tasks: [], hive_checks: [], honey_pumpings: [], treatments: [],
  task_notification_history: [], push_subscriptions: [],
})
let database
try { database = JSON.parse(localStorage.getItem(KEY)) } catch { /* Start fresh. */ }
database ||= initial()
const channels = new Set()
export const getRows = (table) => database[table] ||= []
export const persist = () => localStorage.setItem(KEY, JSON.stringify(database))
export const resetPreview = () => {
  localStorage.removeItem(KEY)
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('beegarden:') && key.endsWith(PREVIEW_USER_ID)) localStorage.removeItem(key)
  }
  window.location.reload()
}
export const emit = (table, eventType, row, old = {}) => {
  persist()
  queueMicrotask(() => {
    for (const channel of channels) for (const listener of channel.listeners) {
      if (listener.config.table !== table) continue
      const filter = listener.config.filter?.split('=eq.')
      if (filter && String(row[filter[0]] ?? old[filter[0]]) !== filter[1]) continue
      if (listener.config.event !== '*' && listener.config.event !== eventType) continue
      listener.callback({ eventType, new: row, old })
    }
  })
}
export const channel = () => {
  const result = {
    listeners: [],
    on(_type, config, callback) { result.listeners.push({ config, callback }); return result },
    subscribe() { channels.add(result); return result },
  }
  return result
}
export const removeChannel = (entry) => channels.delete(entry)

export const query = (table) => {
  let operation = 'select', payload, conflict, single = false, range, cached
  const filters = [], sorts = []
  const matches = (row) => filters.every((predicate) => predicate(row))
  const run = () => {
    if (cached) return cached
    const rows = getRows(table)
    let result
    if (operation === 'select') result = rows.filter(matches)
    else if (operation === 'delete') {
      result = rows.filter(matches)
      database[table] = rows.filter((row) => !matches(row))
      result.forEach((row) => emit(table, 'DELETE', {}, row))
    } else if (operation === 'update') {
      result = rows.filter(matches)
      result.forEach((row) => { const old = { ...row }; Object.assign(row, payload); emit(table, 'UPDATE', row, old) })
    } else {
      result = (Array.isArray(payload) ? payload : [payload]).map((value) => {
        const existing = operation === 'upsert' && conflict
          ? rows.find((row) => conflict.split(',').every((key) => row[key] === value[key])) : null
        if (existing) { const old = { ...existing }; Object.assign(existing, value); emit(table, 'UPDATE', existing, old); return existing }
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...value }
        rows.push(row)
        emit(table, 'INSERT', row)
        return row
      })
    }
    result = [...result]
    for (const [key, options] of [...sorts].reverse()) result.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (options?.ascending === false ? -1 : 1))
    if (range) result = result.slice(range[0], range[1] + 1)
    cached = { data: single ? result[0] || null : result, error: null }
    return cached
  }
  const chain = {
    select() { return chain },
    eq(key, value) { filters.push((row) => String(row[key]) === String(value)); return chain },
    in(key, values) { filters.push((row) => values.includes(row[key])); return chain },
    is(key, value) { filters.push((row) => (row[key] ?? null) === value); return chain },
    order(key, options) { sorts.push([key, options]); return chain },
    range(from, to) { range = [from, to]; return chain },
    limit(count) { range = [0, count - 1]; return chain },
    single() { single = true; return chain },
    maybeSingle() { single = true; return chain },
    insert(value) { operation = 'insert'; payload = value; return chain },
    upsert(value, options) { operation = 'upsert'; payload = value; conflict = options?.onConflict; return chain },
    update(value) { operation = 'update'; payload = value; return chain },
    delete() { operation = 'delete'; return chain },
    then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject) },
  }
  return chain
}
