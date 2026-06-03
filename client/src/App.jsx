import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import api from './api/axios'

import TemporaryDrawer from './componentsMUI/TemporaryDrawer'
import Home from './pages/Home'
import AuthForm from './components/AuthForm'
import LeafyCorners from './components/LeafyCorners'
import ReminderScheduler from './components/ReminderScheduler'
import GlobalNotificationsBell from './components/GlobalNotificationsBell'
import LocationWeatherOverlay from './components/LocationWeatherOverlay'

const Calendar = lazy(() => import('./pages/Calendar'))
const ChecksPerformed = lazy(() => import('./pages/ChecksPerformed'))
const Location = lazy(() => import('./pages/Location'))
const Notes = lazy(() => import('./pages/Notes'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Treatment = lazy(() => import('./pages/Treatment'))
const BeeColonyGraphics = lazy(() => import('./pages/BeeColonyGraphics'))
const VetControl = lazy(() => import('./pages/VetControl'))
const Charts = lazy(() => import('./pages/Charts'))

const HIVES_CACHE_PREFIX = 'beegarden:hives:'
const WEATHER_OVERLAY_COLLAPSED_KEY = 'beegarden:weather-overlay:collapsed'

const normalizeHives = (hives = []) =>
  hives.map((hive) => ({
    id: hive.hive_number ?? hive.id,
    number: hive.hive_number ?? hive.number,
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
  const [hives, setHives] = useState([])
  const [openModalIds, setOpenModalIds] = useState([])
  const [isWeatherOverlayCollapsed, setIsWeatherOverlayCollapsed] = useState(() => {
    try {
      return localStorage.getItem(WEATHER_OVERLAY_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

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
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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

      api.get('/api/hives', {
        params: { user_id: userId },
        signal: controller.signal,
      })
        .then((res) => {
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
      <ReminderScheduler session={session} />
      {!isAdminRoute && <TemporaryDrawer />}
      {!isAdminRoute && openModalIds.length === 0 && (
        <GlobalNotificationsBell
          session={session}
          isWeatherCollapsed={isWeatherOverlayCollapsed}
          onToggleWeather={handleToggleWeatherOverlay}
        />
      )}
      {!isAdminRoute && openModalIds.length === 0 && (
        <LocationWeatherOverlay
          session={session}
          isCollapsed={isWeatherOverlayCollapsed}
        />
      )}

      <div className="relative z-10">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/"
              element={(
                <Home
                  session={session}
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
            <Route path="/location" element={<Location session={session} />} />
            <Route path="/notes" element={<Notes session={session} />} />
            <Route path="/treatment" element={<Treatment session={session} hives={hives} />} />
            <Route path="/pumping" element={<VetControl session={session} hives={hives} />} />
            <Route path="/charts" element={<Charts session={session} hives={hives} />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App
