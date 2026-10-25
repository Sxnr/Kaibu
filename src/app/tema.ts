// Tema claro / oscuro / según el sistema. Se aplica con la clase .dark en <html>.
import type { Tema } from '@/data/db'

const CLAVE = 'kaibu:tema'
const consulta = () => window.matchMedia('(prefers-color-scheme: dark)')

export function temaGuardado(): Tema {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'claro' || v === 'oscuro' || v === 'sistema' ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

function esOscuro(tema: Tema): boolean {
  return tema === 'oscuro' || (tema === 'sistema' && consulta().matches)
}

function pintar(tema: Tema, suave: boolean) {
  const html = document.documentElement
  const oscuro = esOscuro(tema)
  if (html.classList.contains('dark') === oscuro) return
  if (suave) {
    html.classList.add('cambiando-tema')
    window.setTimeout(() => html.classList.remove('cambiando-tema'), 300)
  }
  html.classList.toggle('dark', oscuro)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0F0D0D' : '#FAF7F6')
}

let temaActual: Tema = 'sistema'

export function aplicarTema(tema: Tema, suave = true): void {
  temaActual = tema
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Almacenamiento no disponible (modo privado): el tema igual se aplica.
  }
  pintar(tema, suave)
}

/** Sigue los cambios del sistema cuando el tema es "Según el sistema". */
export function escucharSistema(): () => void {
  const mq = consulta()
  const fn = () => temaActual === 'sistema' && pintar('sistema', true)
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}

export function iniciarTema(): void {
  temaActual = temaGuardado()
  pintar(temaActual, false)
}
