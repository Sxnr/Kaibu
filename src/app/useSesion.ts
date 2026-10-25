// Contexto de sesión y hooks de acceso.
import { createContext, useContext } from 'react'
import type { Perfil } from '@/data/db'

export type EstadoSesion = 'cargando' | 'anonimo' | 'activa'

export interface ValorSesion {
  estado: EstadoSesion
  userId: string | null
  email: string | null
  modoLocal: boolean
  /** true cuando ya se intentó bajar los datos del servidor al menos una vez. */
  datosListos: boolean
  /** Sin conexión en un dispositivo nuevo: aún no hay datos para mostrar. */
  necesitaConexion: boolean
  perfil: Perfil | null | undefined
  sincronizando: boolean
  errorSync: string | null
  ultimaSync: number
  pendientes: number
  enLinea: boolean
  sincronizarAhora: () => void
  entrarLocal: () => void
  cerrarSesion: () => Promise<void>
}

export const ContextoSesion = createContext<ValorSesion | null>(null)

export function useSesion(): ValorSesion {
  const v = useContext(ContextoSesion)
  if (!v) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return v
}

/** userId garantizado (para pantallas protegidas). */
export function useUsuario(): string {
  const { userId } = useSesion()
  if (!userId) throw new Error('No hay sesión activa')
  return userId
}

