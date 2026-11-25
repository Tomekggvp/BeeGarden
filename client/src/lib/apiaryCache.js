const cacheKey = (userId) => `beegarden:apiaries:${userId}`

export const readApiaryCache = (userId, storage = globalThis.localStorage) => {
  if (!userId) return []
  try {
    const rows = JSON.parse(storage.getItem(cacheKey(userId)))
    return Array.isArray(rows) ? rows.filter((row) => row && typeof row.id === 'string' && typeof row.name === 'string') : []
  } catch { return [] }
}

export const writeApiaryCache = (userId, rows, storage = globalThis.localStorage) => {
  if (!userId) return
  try { storage.setItem(cacheKey(userId), JSON.stringify(rows)) } catch { /* Optional offline cache. */ }
}
