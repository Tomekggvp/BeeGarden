import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, Save } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import {
  fetchLocationWeather,
  loadSavedLocation,
  readSavedLocation,
  saveLocationSelection,
  subscribeLocationSelection,
} from '../lib/locationWeather'

const DEFAULT_CENTER = { latitude: 53.9006, longitude: 27.559 }

const formatCoordinate = (value) => Number(value).toFixed(5)

const SelectedPoint = ({ position, onChange }) => {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  if (!position) return null

  return (
    <CircleMarker
      center={[position.latitude, position.longitude]}
      radius={12}
      pathOptions={{
        color: '#8b4f00',
        weight: 3,
        fillColor: '#f8b400',
        fillOpacity: 0.9,
      }}
    />
  )
}

const RecenterMap = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], map.getZoom(), {
        animate: true,
      })
    }
  }, [center, map])

  return null
}

const Location = ({ session }) => {
  const userId = session?.user?.id || ''
  const cachedLocation = readSavedLocation(userId)
  const [selectedLocation, setSelectedLocation] = useState(cachedLocation || DEFAULT_CENTER)
  const [savedLocation, setSavedLocation] = useState(cachedLocation)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const nextCachedLocation = readSavedLocation(userId)
    setSelectedLocation(nextCachedLocation || DEFAULT_CENTER)
    setSavedLocation(nextCachedLocation)
    setErrorMessage('')
    setSuccessMessage('')

    if (!userId) return undefined

    let isMounted = true

    loadSavedLocation(userId)
      .then((nextSavedLocation) => {
        if (!isMounted || !nextSavedLocation) return

        setSelectedLocation(nextSavedLocation)
        setSavedLocation(nextSavedLocation)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Load saved location error:', error)
        setErrorMessage(error.message || 'Не удалось загрузить сохранённую локацию.')
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined

    const subscription = subscribeLocationSelection(userId, {
      onUpsert: (nextLocation) => {
        setSavedLocation(nextLocation)
        setSelectedLocation(nextLocation)
      },
      onDelete: () => {
        setSavedLocation(null)
        setSelectedLocation(DEFAULT_CENTER)
      },
    })

    return () => subscription.unsubscribe()
  }, [userId])

  const handleSave = async () => {
    if (!userId || !selectedLocation) return

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await fetchLocationWeather(selectedLocation)
      const nextSavedLocation = await saveLocationSelection(userId, selectedLocation)
      setSavedLocation(nextSavedLocation)
      setSelectedLocation(nextSavedLocation)
      setSuccessMessage('Локация сохранена. Погода и время теперь подтягиваются для этого пользователя с любого устройства.')
    } catch (error) {
      console.error('Save location error:', error)
      setErrorMessage(error.message || 'Не удалось сохранить локацию.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#f8b400]/35 bg-[#fffaf0] px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9a5a00] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f8b400]"></span>
            BeeGarden
          </div>
          <h1 className="font-['Tenor_Sans'] text-5xl leading-none text-[#2f2100] sm:text-7xl">
            Локация
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold text-[#6f5a26]">
            Нажмите на карту, выберите точку пасеки и сохраните её. После этого сверху на всех страницах будут показаны местное время, температура, ветер и вероятность осадков.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f1d88a] bg-[#fffaf0]/95 px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a5a00]">
              Выбранная точка
            </p>
            <p className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm font-bold text-[#2f2100] sm:text-base">
              <MapPin size={16} className="text-[#f8b400]" />
              <span>{formatCoordinate(selectedLocation.latitude)}, {formatCoordinate(selectedLocation.longitude)}</span>
            </p>

            <p className="mt-1 text-xs font-semibold text-[#7a5a1a]">
              {savedLocation
                ? `Сохранено: ${formatCoordinate(savedLocation.latitude)}, ${formatCoordinate(savedLocation.longitude)}`
                : 'Точка ещё не сохранена.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#f8b400] px-4 font-black text-[#2b1a00] transition-all hover:bg-[#ffd24a] active:scale-[0.99] disabled:opacity-60"
          >
            <Save size={18} />
            {isSaving ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
            {successMessage}
          </p>
        )}

        <div className="relative overflow-hidden rounded-lg border border-[#f1d88a] shadow-[0_20px_40px_rgba(93,58,0,0.14)]">
          <MapContainer
            center={[selectedLocation.latitude, selectedLocation.longitude]}
            zoom={8}
            className="h-[calc(100vh-260px)] min-h-[420px] w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SelectedPoint position={selectedLocation} onChange={setSelectedLocation} />
            <RecenterMap center={selectedLocation} />
          </MapContainer>
        </div>
      </section>
    </main>
  )
}

export default Location
