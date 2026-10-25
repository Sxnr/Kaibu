// Cliente de Supabase. Solo usa la URL y la clave pública "anon" (la seguridad la da RLS).
// Si no están configuradas, la app funciona en "modo local": todo queda en este dispositivo.
// La librería se carga aparte (en paralelo) para que la app abra más rápido.
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const modoLocal = !url || !clave

/** Identificador de usuario usado en modo local (nunca se sincroniza). */
export const USUARIO_LOCAL = 'local'

let promesa: Promise<SupabaseClient | null> | null = null

/** Devuelve el cliente (o null en modo local). Se crea una sola vez. */
export function obtenerSupabase(): Promise<SupabaseClient | null> {
  if (!url || !clave) return Promise.resolve(null)
  promesa ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, clave, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    }),
  )
  return promesa
}

// Empieza a descargar la librería apenas abre la app (sin bloquear la primera pantalla).
if (!modoLocal) void obtenerSupabase()
