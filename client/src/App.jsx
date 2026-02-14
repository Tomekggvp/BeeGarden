import { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
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


function App() {
 
  const isAdminRoute = useLocation().pathname.startsWith('/admin')


  return (
    <>
    {!isAdminRoute && <TemporaryDrawer/>}
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/BeeColonyGraphics' element={<BeeColonyGraphics/>}/>
          <Route path='/Calendar' element={<Calendar/>}/>
          <Route path='/ChecksPerformed' element={<ChecksPerformed/>}/>
          <Route path='/Location' element={<Location/>}/>
          <Route path='/Notes' element={<Notes/>}/>
          <Route path='/Tasks' element={<Tasks/>}/>
          <Route path='/Treatment' element={<Treatment/>}/>
          <Route path='/VetControl' element={<VetControl/>}/>
        </Routes>
        
    </>
  )
}

export default App
