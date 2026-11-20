import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías auto-alojadas (solo el subconjunto latino: cubre el español completo)
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import './styles/index.css'
import { iniciarTema } from './app/tema'
import { iniciarRegistroErrores } from './lib/errores'
import App from './App'

iniciarTema()
iniciarRegistroErrores()

// Tras una actualización, una pestaña que quedó abierta puede pedir partes de la versión anterior que ya
// no existen: se recarga una vez (y no más, para no quedar en un ciclo) y abre la versión nueva.
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('kaibu:recarga-version') === '1') return
    sessionStorage.setItem('kaibu:recarga-version', '1')
  } catch {
    return
  }
  e.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
