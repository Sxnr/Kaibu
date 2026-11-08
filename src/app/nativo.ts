// Kaibu dentro de la app de Android (Capacitor): la web va empaquetada adentro y no usa Chrome.
// Google no permite iniciar sesión dentro de una app embebida: se abre su pestaña segura y vuelve con
// cl.kaibu.app://auth?code=… (flujo PKCE de Supabase). En la web todo sigue igual que siempre.
import type { SupabaseClient } from '@supabase/supabase-js'

interface VentanaConCapacitor {
  Capacitor?: { isNativePlatform?: () => boolean }
}

/** Dirección de la web pública (para descargar novedades o abrir enlaces desde la app). */
export const URL_WEB = 'https://kaibu-nine.vercel.app'
/** A dónde vuelve Google después de iniciar sesión (registrada en Supabase → URL Configuration). */
export const VUELTA_OAUTH = 'cl.kaibu.app://auth'

/** true si Kaibu corre dentro de la app de Android (Capacitor). */
export function esNativa(): boolean {
  try {
    return (window as unknown as VentanaConCapacitor).Capacitor?.isNativePlatform?.() === true
  } catch {
    return false
  }
}

/** Código de la vuelta del login (o null si el enlace no es el de Kaibu). */
export function codigoDeVuelta(enlace: string): string | null {
  if (!enlace.startsWith(VUELTA_OAUTH)) return null
  try {
    return new URL(enlace.replace('cl.kaibu.app://', 'https://cl.kaibu.app/')).searchParams.get('code')
  } catch {
    return null
  }
}

/** Inicia sesión con Google: en la web redirige; en la app abre la pestaña segura de Google. */
export async function entrarConGoogle(supabase: SupabaseClient, vueltaWeb: string) {
  if (!esNativa()) {
    return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: vueltaWeb } })
  }
  const respuesta = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: VUELTA_OAUTH, skipBrowserRedirect: true },
  })
  if (respuesta.data?.url) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: respuesta.data.url, presentationStyle: 'popover' })
  }
  return respuesta
}

/** En la app: escucha la vuelta de Google y cierra la pestaña al terminar. */
export async function escucharVueltaOAuth(obtener: () => Promise<SupabaseClient | null>) {
  if (!esNativa()) return
  const [{ App }, { Browser }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser')])
  await App.addListener('appUrlOpen', async ({ url }) => {
    const codigo = codigoDeVuelta(url)
    if (!codigo) return
    const supabase = await obtener()
    await supabase?.auth.exchangeCodeForSession(codigo)
    await Browser.close().catch(() => undefined)
  })
}
