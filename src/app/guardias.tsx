import { WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { EstadoVacio } from '@/components/EstadoVacio'
import { useConsentimientos } from '@/data/consultas'
import { VERSION_SALUD, VERSION_TERMINOS } from '@/domain/legal'
import { bienvenidaVista } from './bienvenida'
import { CLAVE_CONSENTIMIENTO } from './consentimiento'
import { useSesion } from './useSesion'

type Requisito = 'sesion' | 'consentimiento' | 'perfil'

/**
 * Protege pantallas según lo que falte: sesión → consentimientos → configuración inicial.
 * "hasta" indica el último requisito que exige la pantalla.
 */
export function Guardia({ hasta, children }: { hasta: Requisito; children: ReactNode }) {
  const sesion = useSesion()
  const ubicacion = useLocation()
  const consentimientos = useConsentimientos(sesion.datosListos ? sesion.userId : null)

  if (sesion.estado === 'cargando') return <PantallaCargando />
  if (sesion.estado === 'anonimo') {
    return <Navigate to={bienvenidaVista() ? '/entrar' : '/bienvenida'} replace state={{ desde: ubicacion.pathname }} />
  }
  if (sesion.necesitaConexion) return <SinConexionInicial />
  if (!sesion.datosListos || consentimientos === undefined || sesion.perfil === undefined) {
    return <PantallaCargando texto="Cargando tus datos…" />
  }

  const tieneConsentimientos =
    consentimientos.some((c) => c.tipo === 'terminos' && c.version === VERSION_TERMINOS) &&
    consentimientos.some((c) => c.tipo === 'datos_salud' && c.version === VERSION_SALUD)

  if (hasta === 'sesion') return <>{children}</>
  // Consentimientos marcados al registrarse que aún se están guardando.
  if (!tieneConsentimientos && localStorage.getItem(CLAVE_CONSENTIMIENTO)) return <PantallaCargando />
  if (!tieneConsentimientos) {
    return ubicacion.pathname === '/consentimiento' ? <>{children}</> : <Navigate to="/consentimiento" replace />
  }
  if (hasta === 'consentimiento') return <>{children}</>
  if (!sesion.perfil?.onboardingCompleto) return <Navigate to="/configuracion" replace />
  return <>{children}</>
}

function SinConexionInicial() {
  const { sincronizarAhora } = useSesion()
  return (
    <div className="mx-auto max-w-md p-6 pt-20">
      <EstadoVacio
        icono={WifiOff}
        titulo="Necesitas internet"
        texto="Es la primera vez que abres tu cuenta en este dispositivo. Conéctate a internet para traer tus datos; después Kaibu funciona sin conexión."
        accion={<Boton onClick={sincronizarAhora}>Reintentar</Boton>}
      />
    </div>
  )
}

/** Pantallas públicas (cuenta): si ya hay sesión, lleva a la app. */
export function SoloAnonimo({ children }: { children: ReactNode }) {
  const sesion = useSesion()
  if (sesion.estado === 'cargando') return <PantallaCargando />
  if (sesion.estado === 'activa') return <Navigate to="/" replace />
  return <>{children}</>
}
