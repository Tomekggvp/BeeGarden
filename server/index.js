import express from 'express'
import cors from 'cors'
import { supabase } from './db.js'

const app = express()
const hivesCache = new Map()
const HIVES_CACHE_TTL_MS = 30_000

app.disable('x-powered-by')
app.use(cors())
app.use(express.json())

const getUserId = (value) => String(value || '').trim()
const getHiveNumber = (value) => String(value || '').trim()

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

// --- СПИСОК УЛЬЕВ ---

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

// --- ДЕТАЛИ УЛЬЯ ---

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

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`Server on port ${PORT}`))
