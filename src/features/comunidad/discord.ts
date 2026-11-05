// Conexión de la app con el Discord de Kaibu a través de Supabase (el bot hace el resto).
// Solo funciona con cuenta (no en modo local) y con internet.
import { obtenerSupabase } from '@/data/supabase'

/** Link de invitación al servidor (lo entrega /setup o /invitacion del bot). Si no está, el botón no se muestra. */
export const INVITACION_DISCORD = import.meta.env.VITE_DISCORD_INVITE?.trim() || null

export interface Vinculo {
  discordTag: string | null
  racha: number
}

async function cliente() {
  const s = await obtenerSupabase()
  if (!s) throw new Error('Necesitas una cuenta para usar esta función.')
  return s
}

/** Vínculo actual con Discord (o null si no hay). */
export async function leerVinculo(): Promise<Vinculo | null> {
  const s = await cliente()
  const { data, error } = await s.from('discord_links').select('discord_tag, racha').maybeSingle()
  if (error) throw error
  return data ? { discordTag: data.discord_tag as string | null, racha: Number(data.racha) } : null
}

/** Código de 6 caracteres para escribir en /vincular (dura 10 minutos y sirve una vez). */
export async function crearCodigo(): Promise<string> {
  const s = await cliente()
  const { data, error } = await s.rpc('crear_codigo_discord')
  if (error) throw error
  return String(data)
}

export async function desvincular(): Promise<void> {
  const s = await cliente()
  const { data: sesion } = await s.auth.getUser()
  if (!sesion.user) throw new Error('Sin sesión')
  const { error } = await s.from('discord_links').delete().eq('user_id', sesion.user.id)
  if (error) throw error
}

/** Informa la racha para los roles 🔥 7+ y ⚡ 30+ (si no hay vínculo, no hace nada). */
export async function informarRacha(racha: number): Promise<void> {
  const s = await cliente()
  const { error } = await s.rpc('actualizar_racha_discord', { p_racha: racha })
  if (error) throw error
}
