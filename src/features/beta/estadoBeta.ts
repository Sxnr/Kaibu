// Beta cerrada en la app: interruptor (lo decide la base de datos), validar y canjear el código personal.
// Sin Supabase (modo local o pruebas) manda VITE_BETA_CERRADA y el código solo se revisa por su formato.
import { useEffect, useState } from 'react'
import { modoLocal, obtenerSupabase } from '@/data/supabase'
import { codigoConFormato, normalizarCodigo } from '@/domain/beta/codigo'

const CLAVE_CERRADA = 'kaibu:beta-cerrada'
const CLAVE_CODIGO = 'kaibu:codigo-beta'
const FORZADA = import.meta.env.VITE_BETA_CERRADA === '1'

function leerCache(): boolean | null {
  try {
    const v = localStorage.getItem(CLAVE_CERRADA)
    return v === null ? null : v === '1'
  } catch {
    return null
  }
}

let enCurso: Promise<boolean> | null = null

/** ¿Está cerrada la beta? Se pregunta una vez por visita; si falla, se usa lo último conocido (o cerrada). */
export function consultarBetaCerrada(): Promise<boolean> {
  if (modoLocal) return Promise.resolve(FORZADA)
  enCurso ??= obtenerSupabase()
    .then(async (s) => {
      if (!s) return FORZADA
      const { data, error } = await s.rpc('beta_cerrada')
      if (error) return leerCache() ?? true
      const cerrada = data !== false
      try {
        localStorage.setItem(CLAVE_CERRADA, cerrada ? '1' : '0')
      } catch {
        // Sin almacenamiento: igual responde.
      }
      return cerrada
    })
    .catch(() => leerCache() ?? true)
  return enCurso
}

/** null mientras se pregunta (con lo último conocido como punto de partida, para no parpadear). */
export function useBetaCerrada(): boolean | null {
  const [cerrada, setCerrada] = useState<boolean | null>(() => (modoLocal ? FORZADA : leerCache()))
  useEffect(() => {
    let vivo = true
    void consultarBetaCerrada().then((v) => vivo && setCerrada(v))
    return () => {
      vivo = false
    }
  }, [])
  return cerrada
}

/** ¿El código existe y no se ha usado? (no lo gasta) */
export async function validarCodigo(texto: string): Promise<boolean> {
  if (!codigoConFormato(texto)) return false
  if (modoLocal) return true
  const s = await obtenerSupabase()
  if (!s) return false
  const { data, error } = await s.rpc('codigo_beta_valido', { p_codigo: normalizarCodigo(texto) })
  if (error) throw error
  return data === true
}

/** Canjea el código con la cuenta actual. true = la cuenta quedó con acceso. */
export async function canjearCodigo(texto: string): Promise<boolean> {
  const s = await obtenerSupabase()
  if (!s) return true
  const { data, error } = await s.rpc('canjear_codigo_beta', { p_codigo: normalizarCodigo(texto) })
  if (error) throw error
  return data === true
}

/** ¿Esta cuenta puede usar Kaibu? (beta abierta o cuenta con acceso) */
export async function tieneAcceso(): Promise<boolean> {
  const s = await obtenerSupabase()
  if (!s) return true
  const { data, error } = await s.rpc('puede_usar_kaibu')
  if (error) throw error
  return data === true
}

// Código validado en /beta que se canjea apenas la persona crea su cuenta (dura lo que la pestaña).
export function guardarCodigoPendiente(texto: string) {
  try {
    sessionStorage.setItem(CLAVE_CODIGO, normalizarCodigo(texto))
  } catch {
    // Sin almacenamiento: tendrá que escribirlo de nuevo después de crear la cuenta.
  }
}

export function leerCodigoPendiente(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_CODIGO)
  } catch {
    return null
  }
}

export function borrarCodigoPendiente() {
  try {
    sessionStorage.removeItem(CLAVE_CODIGO)
  } catch {
    // Nada que borrar.
  }
}
