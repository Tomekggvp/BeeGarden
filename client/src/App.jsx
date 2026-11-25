import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'

import AuthForm from './components/AuthForm'
import LeafyCorners from './components/LeafyCorners'

const ApiaryPanel = lazy(() => import('./components/ApiaryPanel'))
const TemporaryDrawer = lazy(() => import('./componentsMUI/TemporaryDrawer'))
const ReminderScheduler = lazy(() => import('./components/ReminderScheduler'))
const GlobalNotificationsBell = lazy(() => import('./components/GlobalNotificationsBell'))
const LocationWeatherOverlay = lazy(() => import('./components/LocationWeatherOverlay'))

const Calendar = lazy(() => import('./pages/Calendar'))
const Home = lazy(() => import('./pages/Home'))
const ChecksPerformed = lazy(() => import('./pages/ChecksPerformed'))
const Location = lazy(() => import('./pages/Location'))
const Notes = lazy(() => import('./pages/Notes'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Treatment = lazy(() => import('./pages/Treatment'))
const BeeColonyGraphics = lazy(() => import('./pages/BeeColonyGraphics'))
const VetControl = lazy(() => import('./pages/VetControl'))
const Charts = lazy(() => import('./pages/Charts'))

const HIVES_CACHE_PREFIX = 'beegarden:hives:v2:'
const WEATHER_OVERLAY_COLLAPSED_KEY = 'beegarden:weather-overlay:collapsed'

const normalizeHives = (hives = []) =>
  hives.map((hive) => ({
    id: hive.hive_number ?? hive.id,
    number: hive.hive_number ?? hive.number,
    apiaryId: hive.apiary_id ?? hive.apiaryId,
  }))

const getHivesCacheKey = (userId) => `${HIVES_CACHE_PREFIX}${userId}`

const readCachedHives = (userId) => {
  try {
    const cached = localStorage.getItem(getHivesCacheKey(userId))
    if (!cached) return []

    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Hive cache read error:', err)
    return []
  }
}

const writeCachedHives = (userId, hives) => {
  try {
    localStorage.setItem(getHivesCacheKey(userId), JSON.stringify(hives))
  } catch (err) {
    console.error('Hive cache write error:', err)
  }
}

const LoadingBee = ({ label }) => (
  <div className="loading-bee-wrap" role="status" aria-live="polite">
    <div className="loading-bee-stage">
      <img className="loading-bee-icon" src="/bee.png" alt="" />
    </div>
    <p className="mt-5 text-base font-black text-[#7a4a00]">{label}</p>
  </div>
)

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center">
    <LoadingBee label="Загрузка пасеки..." />
  </div>
)

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingBee label="Загрузка..." />
  </div>
)

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hivesLoading, setHivesLoading] = useState(false)
  const [allHives, setHives] = useState([])
  const [apiaryState, setApiaryState] = useState({ userId: null, rows: [], selectedId: '', loading: true, error: '' })
  const [openModalIds, setOpenModalIds] = useState([])
  const [isWeatherOverlayCollapsed, setIsWeatherOverlayCollapsed] = useState(() => {
    try {
      return localStorage.getItem(WEATHER_OVERLAY_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

  const apiaries = apiaryState.userId === session?.user?.id ? apiaryState.rows : []
  const activeApiary = apiaries.find((item) => item.id === apiaryState.selectedId)
    || apiaries.find((item) => item.is_default) || apiaries[0] || null
  const hives = activeApiary ? allHives.filter((hive) => hive.apiaryId === activeApiary.id
    || (!hive.apiaryId && activeApiary.is_default)) : []

  useEffect(() => {
    const userId = session?.user?.id
    let cancelled = false
    if (!userId) return undefined
    Promise.resolve().then(async () => {
      if (cancelled) return
      setApiaryState({ userId, rows: [], selectedId: '', loading: true, error: '' })
      try {
        const { listApiaries } = await import('./lib/apiaries')
        const rows = await listApiaries(userId)
        if (cancelled) return
        let selectedId = ''
        try { selectedId = localStorage.getItem(`beegarden:active-apiary:${userId}`) || '' } catch { /* Optional preference. */ }
        setApiaryState({ userId, rows, selectedId, loading: false, error: '' })
      } catch (error) {
        console.error('Load apiaries failed:', error.message)
        if (!cancelled) setApiaryState({ userId, rows: [], selectedId: '', loading: false, error: 'Не удалось загрузить пасеки. Обновите страницу и попробуйте снова.' })
      }
    })
    return () => { cancelled = true }
  }, [session?.user?.id])

  const selectApiary = (id) => {
    if (!apiaries.some((item) => item.id === id)) return
    setApiaryState((current) => ({ ...current, selectedId: id }))
    try { localStorage.setItem(`beegarden:active-apiary:${session.user.id}`, id) } catch { /* Optional preference. */ }
  }

  const handleSaveApiary = async (name, id) => {
    const { saveApiary } = await import('./lib/apiaries')
    const saved = await saveApiary(session.user.id, name, id)
    setApiaryState((current) => ({ ...current,
      rows: id ? current.rows.map((item) => item.id === id ? saved : item) : [...current.rows, saved],
      selectedId: saved.id,
    }))
    try { localStorage.setItem(`beegarden:active-apiary:${session.user.id}`, saved.id) } catch { /* Optional preference. */ }
  }

  const handleLocationSaved = (location) => {
    setApiaryState((current) => ({ ...current, rows: current.rows.map((item) => item.id === location.apiaryId
      ? { ...item, latitude: location.latitude, longitude: location.longitude, saved_at: location.savedAt } : item) }))
  }

  const apiaryControls = { apiaries, activeApiary, onSelect: selectApiary, onSave: handleSaveApiary,
    loading: apiaryState.loading, error: apiaryState.error }

  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const handleModalVisibility = (event) => {
      const modalId = String(event?.detail?.modalId || '').trim()
      if (!modalId) return

      setOpenModalIds((currentIds) => {
        const isOpen = Boolean(event?.detail?.open)
        const nextIds = new Set(currentIds)

        if (isOpen) {
          nextIds.add(modalId)
        } else {
          nextIds.delete(modalId)
        }

        return Array.from(nextIds)
      })
    }

    window.addEventListener('beegarden:modal-visibility', handleModalVisibility)
    return () => window.removeEventListener('beegarden:modal-visibility', handleModalVisibility)
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      setLoading(false)
    }).catch((error) => {
      console.error('Session initialization failed:', error.message)
      if (isMounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    const controller = new AbortController()

    Promise.resolve().then(() => {
      if (controller.signal.aborted) return

      if (!userId) {
        setHives([])
        setHivesLoading(false)
        return
      }

      const cachedHives = readCachedHives(userId)
      setHives(cachedHives)
      setHivesLoading(cachedHives.length === 0)

      import('./api/axios').then(({ default: api }) => api.get('/api/hives', {
        params: { user_id: userId },
        signal: controller.signal,
      }))
        .then((res) => {
          if (controller.signal.aborted) return
          const nextHives = normalizeHives(res.data)
          setHives(nextHives)
          writeCachedHives(userId, nextHives)
        })
        .catch((err) => {
          if (err.code !== 'ERR_CANCELED') {
            console.error(err)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setHivesLoading(false)
          }
        })
    })

    return () => controller.abort()
  }, [session?.user?.id])

  const updateHives = useCallback((updater) => {
    setHives((currentHives) => {
      const nextHives = typeof updater === 'function' ? updater(currentHives) : updater
      const userId = session?.user?.id

      if (userId) {
        writeCachedHives(userId, nextHives)
      }

      return nextHives
    })
  }, [session?.user?.id])

  const handleToggleWeatherOverlay = useCallback(() => {
    setIsWeatherOverlayCollapsed((currentValue) => {
      const nextValue = !currentValue

      try {
        localStorage.setItem(WEATHER_OVERLAY_COLLAPSED_KEY, nextValue ? '1' : '0')
      } catch {
        // ignore
      }

      return nextValue
    })
  }, [])

  if (loading) {
    return (
      <>
        <LeafyCorners />
        <div className="relative z-10">
          <LoadingScreen />
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <LeafyCorners />
        <div className="relative z-10">
          <AuthForm />
        </div>
      </>
    )
  }

  return (
    <>
      <LeafyCorners />
      <Suspense fallback={<PageFallback />}>
        <ReminderScheduler key={`reminders:${session.user.id}`} session={session} />
        {!isAdminRoute && <TemporaryDrawer />}
        {import.meta.env.DEV && import.meta.env.VITE_APIARY_PREVIEW === '1' && (
          <div className="relative mx-auto max-w-6xl rounded-lg bg-[#2f2100] px-4 py-3 text-sm font-bold text-white">
            Локальная проверка: тестовые данные сохраняются только в этом браузере. Рабочая база не изменяется.
            <button type="button" className="ml-3 underline" onClick={async () => { const { resetPreview } = await import('../preview/store'); resetPreview() }}>Сбросить тестовые данные</button>
          </div>
        )}
        {!isAdminRoute && (
          <GlobalNotificationsBell
            key={`notifications:${session.user.id}`}
            session={session}
            isWeatherCollapsed={isWeatherOverlayCollapsed}
            onToggleWeather={handleToggleWeatherOverlay}
          />
        )}
        {!isAdminRoute && (
          <LocationWeatherOverlay
            key={`${session.user.id}:${activeApiary?.id}`}
            session={session}
            apiary={activeApiary}
            isCollapsed={isWeatherOverlayCollapsed || openModalIds.length > 0}
          />
        )}

        <div className="relative z-10">
          {location.pathname !== '/' && <div className="mx-auto max-w-6xl px-4 pt-4"><ApiaryPanel key={activeApiary?.id} {...apiaryControls} compact /></div>}
          <Suspense fallback={<PageFallback />}>
            <Routes key={`${session.user.id}:${activeApiary?.id}`}>
              <Route
                path="/"
                element={(
                  <Home
                    session={session}
                    apiaryControls={apiaryControls}
                    hives={hives}
                    hivesLoading={hivesLoading}
                    onHivesChange={updateHives}
                  />
                )}
              />
              <Route path="/tasks" element={<Tasks session={session} hives={hives} />} />
              <Route path="/bee-colonies" element={<BeeColonyGraphics session={session} hives={hives} />} />
              <Route path="/calendar" element={<Calendar session={session} />} />
              <Route path="/checks" element={<ChecksPerformed session={session} hives={hives} />} />
              <Route path="/location" element={<Location session={session} apiary={activeApiary} onLocationSaved={handleLocationSaved} />} />
              <Route path="/notes" element={<Notes session={session} />} />
              <Route path="/treatment" element={<Treatment session={session} hives={hives} />} />
              <Route path="/pumping" element={<VetControl session={session} hives={hives} />} />
              <Route path="/charts" element={<Charts session={session} hives={hives} />} />
              <Route path="*" element={<Home session={session} apiaryControls={apiaryControls} hives={hives} hivesLoading={hivesLoading} onHivesChange={updateHives} />} />
            </Routes>
          </Suspense>
        </div>
      </Suspense>
    </>
  )
}

export default App
