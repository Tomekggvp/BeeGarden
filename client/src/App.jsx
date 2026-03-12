import { useState, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import api from './api/axios'

import TemporaryDrawer from './componentsMUI/TemporaryDrawer'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import ChecksPerformed from './pages/ChecksPerformed'
import Location from './pages/Location'
import Notes from './pages/Notes'
import Tasks from './pages/Tasks'
import Treatment from './pages/Treatment'
import BeeColonyGraphics from './pages/BeeColonyGraphics'
import VetControl from './pages/VetControl'
import AuthForm from './components/AuthForm'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hives, setHives] = useState([])
  
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchHives = async () => {
      if (session?.user?.id) {
        try {
          const res = await api.get('/api/hives', { params: { user_id: session.user.id } })
          setHives(res.data.map(h => ({
            id: h.hive_number,
            number: h.hive_number,
          })))
        } catch (err) { console.error(err) }
      }
    }
    fetchHives()
  }, [session])

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-yellow-700 bg-yellow-50">Загрузка пасеки...</div>
  if (!session) return <AuthForm />

  return (
    <>
      {!isAdminRoute && <TemporaryDrawer />}
      
      <Routes>
        <Route path='/' element={<Home session={session} hives={hives} />} />
        <Route path='/Tasks' element={<Tasks session={session} hives={hives} />} />
        <Route path='/BeeColonyGraphics' element={<BeeColonyGraphics session={session} />} />
        <Route path='/Calendar' element={<Calendar session={session} />} />
        <Route path='/ChecksPerformed' element={<ChecksPerformed session={session} />} />
        <Route path='/Location' element={<Location session={session} />} />
        <Route path='/Notes' element={<Notes session={session} />} />
        <Route path='/Treatment' element={<Treatment session={session} />} />
        <Route path='/VetControl' element={<VetControl session={session} />} />
      </Routes>
    </>
  )
}

export default App