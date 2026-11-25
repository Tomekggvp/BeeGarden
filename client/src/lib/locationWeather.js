import { subscribeDataChange } from './liveEvents'
import api from '../api/axios'
import { supabase } from '../services/supabaseClient'
import { requestWeather } from './weatherRequest'

export const LOCATION_WEATHER_EVENT = 'beegarden:location-weather-updated'
const buildStorageKey = (userId, apiaryId) => `beegarden:location-weather:${apiaryId}:${userId}`

const normalizeLocation = (row, userId, apiaryId) => {
  if (!row || row.latitude == null || row.longitude == null) return null
  const latitude = Number(row.latitude)
  const longitude = Number(row.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude, apiaryId, userId, savedAt: row.saved_at || row.savedAt || row.updated_at || null }
}

const cacheLocation = (userId, apiaryId, location) => {
  try {
    const key = buildStorageKey(userId, apiaryId)
    if (location) localStorage.setItem(key, JSON.stringify(location))
    else localStorage.removeItem(key)
  } catch { /* Optional cache. */ }
}

export const readSavedLocation = (userId, apiaryId) => {
  if (!userId || !apiaryId) return null
  try { return normalizeLocation(JSON.parse(localStorage.getItem(buildStorageKey(userId, apiaryId))), userId, apiaryId) }
  catch { return null }
}

export const loadSavedLocation = async (userId, apiaryId) => {
  if (!userId || !apiaryId) return null
  const { data, error } = await supabase.from('apiaries')
    .select('latitude,longitude,saved_at,updated_at').eq('user_id', userId).eq('id', apiaryId).maybeSingle()
  if (error) throw error
  const location = normalizeLocation(data, userId, apiaryId)
  cacheLocation(userId, apiaryId, location)
  return location
}

export const saveLocationSelection = async (userId, location, apiaryId) => {
  if (!userId || !apiaryId) throw new Error('Сначала выберите пасеку.')
  if (!normalizeLocation(location, userId, apiaryId)) throw new Error('Выберите корректную точку на карте.')
  const now = new Date().toISOString()
  const { data, error } = await supabase.from('apiaries')
    .update({ latitude: Number(location.latitude), longitude: Number(location.longitude), saved_at: now, updated_at: now })
    .eq('user_id', userId).eq('id', apiaryId).select('latitude,longitude,saved_at,updated_at').single()
  if (error) throw error
  const saved = normalizeLocation(data, userId, apiaryId)
  cacheLocation(userId, apiaryId, saved)
  window.dispatchEvent(new CustomEvent(LOCATION_WEATHER_EVENT, { detail: saved }))
  return saved
}

export const subscribeLocationSelection = (userId, handlers = {}, apiaryId) => {
  if (!userId || !apiaryId) return { unsubscribe() {} }
  let stopped = false
  let revision = 0
  const unsubscribe = subscribeDataChange(userId, ['apiaries', 'user_locations'], async () => {
    const current = ++revision
    try {
      const location = await loadSavedLocation(userId, apiaryId)
      if (stopped || revision !== current) return
      if (location) handlers.onUpsert?.(location)
      else handlers.onDelete?.()
    } catch (error) {
      if (!stopped) console.error('Location live refresh failed:', error.message)
    }
  })
  return { unsubscribe: () => { stopped = true; unsubscribe() } }
}

const findNearestValue = (times = [], values = [], targetTime) => {
  if (!times.length || !values.length || !targetTime) return null

  const targetTimestamp = new Date(targetTime).getTime()
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  times.forEach((time, index) => {
    const distance = Math.abs(new Date(time).getTime() - targetTimestamp)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return values[nearestIndex] ?? null
}

export const fetchLocationWeather = async ({ latitude, longitude, signal } = {}) => {
  const data = await requestWeather({ latitude, longitude, signal }, async () => {
    const { data } = await api.get('/api/weather/location', {
    signal,
    timeout: 10000,
    params: {
      latitude,
      longitude,
    },
    })
    return data
  })

  const precipitationProbability = findNearestValue(
    data?.hourly?.time,
    data?.hourly?.precipitation_probability,
    data?.current?.time
  )

  return {
    latitude: Number(data.latitude ?? latitude),
    longitude: Number(data.longitude ?? longitude),
    timezone: data.timezone || 'UTC',
    timezoneAbbreviation: data.timezone_abbreviation || '',
    currentTime: data?.current?.time || null,
    temperature: data?.current?.temperature_2m ?? null,
    isDay: Boolean(data?.current?.is_day),
    windSpeed: data?.current?.wind_speed_10m ?? null,
    precipitationProbability,
    fetchedAt: new Date().toISOString(),
  }
}
