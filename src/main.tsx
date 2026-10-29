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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
