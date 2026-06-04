import { supabase } from '../services/supabaseClient'

export const LOCATION_WEATHER_EVENT = 'beegarden:location-weather-updated'

const USER_LOCATIONS_TABLE = 'user_locations'

const buildStorageKey = (userId) => `beegarden:location-weather:${userId}`

const normalizeLocation = (row) => {
  const latitude = Number(row?.latitude)
  const longitude = Number(row?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return {
    latitude,
    longitude,
    savedAt: row?.saved_at || row?.savedAt || row?.updated_at || null,
  }
}

const withLocationHint = (error) => {
  if (!error) return error

  if (error.code === 'PGRST205' || /user_locations/i.test(String(error.message || ''))) {
    return Object.assign(new Error(
      "РќРµ РЅР°Р№РґРµРЅР° С‚Р°Р±Р»РёС†Р° 'public.user_locations' РІ Supabase. Р’С‹РїРѕР»РЅРёС‚Рµ SQL РёР· С„Р°Р№Р»Р° supabase_user_locations.sql Рё РѕР±РЅРѕРІРёС‚Рµ PostgREST schema cache РІ РЅР°СЃС‚СЂРѕР№РєР°С… API."
    ), { originalError: error })
  }

  return error
}

const writeCachedLocation = (userId, location) => {
  if (!userId || !location) return

  try {
    localStorage.setItem(buildStorageKey(userId), JSON.stringify(location))
  } catch {
    // ignore cache write errors
  }
}

const removeCachedLocation = (userId) => {
  if (!userId) return

  try {
    localStorage.removeItem(buildStorageKey(userId))
  } catch {
    // ignore cache removal errors
  }
}

const emitLocationUpdate = (location) => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(LOCATION_WEATHER_EVENT, { detail: location }))
}

const upsertLocationRow = async (userId, location) => {
  const timestamp = new Date().toISOString()
  const payload = {
    user_id: userId,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    saved_at: location.savedAt || timestamp,
    updated_at: timestamp,
  }

  const { data, error } = await supabase
    .from(USER_LOCATIONS_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('latitude, longitude, saved_at, updated_at')
    .single()

  if (error) throw withLocationHint(error)

  return normalizeLocation(data) || normalizeLocation(payload)
}

export const readSavedLocation = (userId) => {
  if (!userId) return null

  try {
    const raw = localStorage.getItem(buildStorageKey(userId))
    if (!raw) return null

    return normalizeLocation(JSON.parse(raw))
  } catch {
    return null
  }
}

export const loadSavedLocation = async (userId) => {
  if (!userId) return null

  const { data, error } = await supabase
    .from(USER_LOCATIONS_TABLE)
    .select('latitude, longitude, saved_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw withLocationHint(error)

  const normalizedLocation = normalizeLocation(data)

  if (normalizedLocation) {
    writeCachedLocation(userId, normalizedLocation)
    return normalizedLocation
  }

  const cachedLocation = readSavedLocation(userId)
  if (!cachedLocation) {
    removeCachedLocation(userId)
    return null
  }

  try {
    const migratedLocation = await upsertLocationRow(userId, cachedLocation)
    writeCachedLocation(userId, migratedLocation)
    return migratedLocation
  } catch (migrationError) {
    console.error('Location migration error:', migrationError)
    return cachedLocation
  }
}

export const saveLocationSelection = async (userId, location) => {
  if (!userId) return null

  const normalizedLocation = await upsertLocationRow(userId, location)
  writeCachedLocation(userId, normalizedLocation)
  emitLocationUpdate(normalizedLocation)

  return normalizedLocation
}

export const subscribeLocationSelection = (userId, handlers = {}) => {
  const safeUserId = String(userId || '').trim()
  if (!safeUserId) return { unsubscribe: () => {} }

  const { onUpsert, onDelete } = handlers

  const channel = supabase
    .channel(`user-locations-${safeUserId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: USER_LOCATIONS_TABLE,
      filter: `user_id=eq.${safeUserId}`,
    }, (payload) => {
      if (payload.eventType === 'DELETE') {
        removeCachedLocation(safeUserId)
        onDelete?.(payload.old)
        return
      }

      const normalizedLocation = normalizeLocation(payload.new)
      if (!normalizedLocation) return

      writeCachedLocation(safeUserId, normalizedLocation)
      onUpsert?.(normalizedLocation)
    })
    .subscribe()

  return {
    unsubscribe: () => {
      try {
        supabase.removeChannel(channel)
      } catch (err) {
        console.error('Location realtime unsubscribe error:', err)
      }
    },
  }
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
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'temperature_2m,is_day,wind_speed_10m')
  url.searchParams.set('hourly', 'precipitation_probability')
  url.searchParams.set('forecast_hours', '24')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РїРѕРіРѕРґРЅС‹Рµ РґР°РЅРЅС‹Рµ.')
  }

  const data = await response.json()

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
