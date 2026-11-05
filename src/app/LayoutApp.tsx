import { AnimatePresence, m } from 'motion/react'
import { Suspense, useEffect } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router'
import { toast } from 'sonner'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { CLAVE_VERSION_VISTA, debeAvisarNovedades, versionLegible } from '@/features/novedades/cambios'
import { useAvisosEstado } from '@/features/comunidad/useAvisosEstado'
import { BarraInferior, MenuLateral } from './Navegacion'
import { useSesion } from './useSesion'

/** Al abrir la app después de una actualización, un aviso con "Ver novedades" (una sola vez por versión). */
function useAvisoNovedades() {
  const navegar = useNavigate()
  useEffect(() => {
    let vista: string | null = null
    try {
      vista = localStorage.getItem(CLAVE_VERSION_VISTA)
      localStorage.setItem(CLAVE_VERSION_VISTA, __VERSION__)
    } catch {
      return
    }
    if (!debeAvisarNovedades(vista, __VERSION__)) return
    toast(`Kaibu se actualizó a la versión ${versionLegible(__VERSION__)}`, {
      duration: 10_000,
      action: { label: 'Ver novedades', onClick: () => navegar('/novedades') },
    })
  }, [navegar])
}

/** Estructura de la app: menú lateral en PC, pestañas abajo en celular y transición entre pantallas. */
export function LayoutApp() {
  const location = useLocation()
  const outlet = useOutlet()
  const { userId } = useSesion()
  useAvisoNovedades()
  useAvisosEstado(userId)
  return (
    <div className="min-h-dvh">
      <a href="#contenido" className="sr-only-focusable fixed top-2 left-2 z-50 rounded-xl bg-marca px-4 py-3 text-sobre-marca">
        Saltar al contenido
      </a>
      <MenuLateral />
      <main id="contenido" tabIndex={-1} className="overflow-x-clip pb-28 outline-none lg:pb-10 lg:pl-64">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={location.pathname}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8"
          >
            <Suspense fallback={<PantallaCargando />}>{outlet}</Suspense>
          </m.div>
        </AnimatePresence>
      </main>
      <BarraInferior />
    </div>
  )
}

/** Estructura simple para pantallas fuera de la app (bienvenida, cuenta, configuración). */
export function LayoutSimple() {
  const location = useLocation()
  const outlet = useOutlet()
  return (
    <main id="contenido" className="min-h-dvh overflow-x-clip">
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={location.pathname}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
        >
          <Suspense fallback={<PantallaCargando />}>{outlet}</Suspense>
        </m.div>
      </AnimatePresence>
    </main>
  )
}
