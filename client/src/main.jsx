import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

// An open tab can reference chunks removed by an atomic Netlify deployment.
// Retry with the current HTML once; persistent failures use the error screen.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const key = 'beegarden:chunk-reload-at'
    const previous = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - previous < 60000) return
    sessionStorage.setItem(key, String(Date.now()))
    event.preventDefault()
    window.location.reload()
  } catch { /* The error boundary handles unavailable storage or reload failures. */ }
})

createRoot(document.getElementById('root')).render(
  
  <AppErrorBoundary>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </AppErrorBoundary>
  
)
