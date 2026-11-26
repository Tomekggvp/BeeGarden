import { useEffect, useState } from 'react'
import { CloudRain, Wind } from 'lucide-react'
import { MENU_VISIBILITY_EVENT } from '../componentsMUI/TemporaryDrawer'
import {
  fetchLocationWeather,
  loadSavedLocation,
  LOCATION_WEATHER_EVENT,
  readSavedLocation,
  subscribeLocationSelection,
} from '../lib/locationWeather'

const formatTemperature = (value) =>
  value === null || value === undefined ? '--' : `${Math.round(value)}°C`

const formatWind = (value) =>
  value === null || value === undefined ? '--' : `${Math.round(value)} км/ч`

const formatPrecipitation = (value) =>
  value === null || value === undefined ? '--' : `${Math.round(value)}%`

const LocationWeatherOverlay = ({ session, apiary, isCollapsed = false }) => {
  const userId = session?.user?.id || ''
  const apiaryId = apiary?.id
  const [savedLocationState, setSavedLocationState] = useState(() => ({
    userId,
    location: readSavedLocation(userId, apiaryId),
  }))
  const [weather, setWeather] = useState(null)
  const [isMenuHidden, setIsMenuHidden] = useState(false)
  const [isModalHidden, setIsModalHidden] = useState(false)
  const isHidden = isMenuHidden || isModalHidden
  const savedLocation = savedLocationState.userId === userId
    ? savedLocationState.location
    : readSavedLocation(userId, apiaryId)

  useEffect(() => {
    if (!userId || !apiaryId) return undefined

    let isMounted = true

    loadSavedLocation(userId, apiaryId)
      .then((nextSavedLocation) => {
        if (!isMounted) return
        setSavedLocationState({
          userId,
          location: nextSavedLocation,
        })
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Load saved location for overlay error:', error)
      })

    return () => {
      isMounted = false
    }
  }, [userId, apiaryId])

  useEffect(() => {
    const handleLocationUpdate = (event) => {
      if (event.detail?.apiaryId !== apiaryId || event.detail?.userId !== userId) return
      const nextLocation = event?.detail?.latitude != null
        ? event.detail
        : readSavedLocation(userId, apiaryId)

      setSavedLocationState({
        userId,
        location: nextLocation || null,
      })
    }

    const handleStorage = (event) => {
      if (event.key && userId && event.key.includes(`beegarden:location-weather:${apiaryId}:${userId}`)) {
        setSavedLocationState({
          userId,
          location: readSavedLocation(userId, apiaryId),
        })
      }
    }

    const subscription = subscribeLocationSelection(userId, {
      onUpsert: (nextLocation) => {
        setSavedLocationState({
          userId,
          location: nextLocation,
        })
      },
      onDelete: () => {
        setSavedLocationState({
          userId,
          location: null,
        })
      },
    }, apiaryId)

    window.addEventListener(LOCATION_WEATHER_EVENT, handleLocationUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener(LOCATION_WEATHER_EVENT, handleLocationUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [userId, apiaryId])

  useEffect(() => {
    if (savedLocation?.latitude == null || savedLocation?.longitude == null) return undefined

    const controller = new AbortController()

    const loadWeather = async () => {
      try {
        const nextWeather = await fetchLocationWeather({
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) setWeather({ ...nextWeather, locationKey: `${savedLocation.latitude},${savedLocation.longitude}` })
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Location weather load error:', error)
        }
      }
    }

    loadWeather()
    const refreshInterval = window.setInterval(loadWeather, 5 * 60 * 1000)

    return () => {
      controller.abort()
      window.clearInterval(refreshInterval)
    }
  }, [savedLocation?.latitude, savedLocation?.longitude])

  useEffect(() => {
    const handler = (event) => {
      setIsMenuHidden(Boolean(event?.detail?.open))
    }

    window.addEventListener(MENU_VISIBILITY_EVENT, handler)
    return () => window.removeEventListener(MENU_VISIBILITY_EVENT, handler)
  }, [])

  useEffect(() => {
    const handler = (event) => {
      setIsModalHidden(Boolean(event?.detail?.open))
    }

    window.addEventListener('beegarden:modal-visibility', handler)
    return () => window.removeEventListener('beegarden:modal-visibility', handler)
  }, [])

  const visibleWeather = savedLocation && weather?.locationKey === `${savedLocation.latitude},${savedLocation.longitude}` ? weather : null

  if (!userId || isHidden || isCollapsed || !savedLocation || !visibleWeather) return null

  return (
    <div className="pointer-events-none relative z-10 mx-auto my-3 w-[min(92vw,720px)]">
      <div className="rounded-lg border border-[#f1d88a] bg-[#fffaf0]/96 px-4 py-3 shadow-[0_16px_36px_rgba(93,58,0,0.18)] backdrop-blur">
        <p className="mb-2 truncate text-center text-xs font-black text-[#7a5a1a]">{apiary?.name}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-center text-[#2f2100]">
          <div className="min-w-[110px]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Температура
            </p>
            <p className="mt-1 text-base font-black">{formatTemperature(visibleWeather.temperature)}</p>
          </div>

          <div className="min-w-[110px]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Ветер
            </p>
            <div className="mt-1 inline-flex items-center gap-2 text-base font-black">
              <Wind size={18} className="text-[#4a7c59]" />
              <span>{formatWind(visibleWeather.windSpeed)}</span>
            </div>
          </div>

          <div className="min-w-[110px]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Осадки
            </p>
            <div className="mt-1 inline-flex items-center gap-2 text-base font-black">
              <CloudRain size={18} className="text-[#3776b6]" />
              <span>{formatPrecipitation(visibleWeather.precipitationProbability)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationWeatherOverlay
