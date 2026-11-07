// Conexión de la app con el Discord de Kaibu a través de Supabase (el bot hace el resto).
// Solo funciona con cuenta (no en modo local) y con internet.
import { obtenerSupabase } from '@/data/supabase'
import type { ParametrosPublicacion } from '@/domain/comunidad/publicarSemana'

/** Link de invitación al servidor (lo entrega /setup o /invitacion del bot). Si no está, el botón no se muestra. */
export const INVITACION_DISCORD = import.meta.env.VITE_DISCORD_INVITE?.trim() || null

export interface PreferenciasDiscord {
  /** Mensaje a las 21:00 si ese día no anotaste nada. */
  recordatorio: boolean
  /** Celebrar en #progreso cuando llegas a 7 o 30 días de racha. */
  celebrarRachas: boolean
  /** Mensaje privado cuando el equipo responde tus reportes o sugerencias. */
  avisosDm: boolean
}

export interface Vinculo extends PreferenciasDiscord {
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
  const { data, error } = await s.from('discord_links').select('discord_tag, racha, recordatorio, celebrar_rachas, avisos_dm').maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    discordTag: data.discord_tag as string | null,
    racha: Number(data.racha),
    // Si la migración aún no corre, las columnas no vienen: valores por defecto.
    recordatorio: data.recordatorio === true,
    celebrarRachas: data.celebrar_rachas === true,
    avisosDm: data.avisos_dm !== false,
  }
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

/** Guarda las preferencias de la comunidad (solo esas 3 columnas se pueden cambiar desde la app). */
export async function guardarPreferencias(p: PreferenciasDiscord): Promise<void> {
  const s = await cliente()
  const { data: sesion } = await s.auth.getUser()
  if (!sesion.user) throw new Error('Sin sesión')
  const { error } = await s
    .from('discord_links')
    .update({ recordatorio: p.recordatorio, celebrar_rachas: p.celebrarRachas, avisos_dm: p.avisosDm })
    .eq('user_id', sesion.user.id)
  if (error) throw error
}

export type ResultadoPublicar = 'ok' | 'sin_vinculo' | 'limite' | 'error'

/** Pide al bot publicar tu semana en #progreso (máximo 3 al día). */
export async function publicarSemana(params: ParametrosPublicacion): Promise<ResultadoPublicar> {
  const s = await cliente()
  const { error } = await s.rpc('publicar_semana_discord', params)
  if (!error) return 'ok'
  if (error.code === 'P0002') return 'sin_vinculo'
  if (error.code === '23514') return 'limite'
  return 'error'
}

/** Informa la racha para los roles 🔥 7+ y ⚡ 30+ (si no hay vínculo, no hace nada). */
export async function informarRacha(racha: number): Promise<void> {
  const s = await cliente()
  const { error } = await s.rpc('actualizar_racha_discord', { p_racha: racha })
  if (error) throw error
}
