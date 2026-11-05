// Comunidad conectada (app ↔ Discord): seguimiento de beta testers, recordatorio de las 21:00,
// "Mi semana" publicada desde la app, novedades automáticas, avisos de estado y celebración de rachas.
// Privacidad: de la app solo se lee SI la persona anotó y QUÉ DÍA (función actividad_discord), nunca qué comió.
const { supabase, APP_URL, COLOR } = require('./config')
const { embedKaibu } = require('./marca')
const R = require('./reglas')
const { truncar } = require('./texto')

/** Servidor principal: el de DISCORD_GUILD_ID o, si no hay, el primero configurado con /setup. */
async function configPrincipal() {
  let consulta = supabase().from('discord_guild_config').select('*').order('created_at').limit(1)
  if (process.env.DISCORD_GUILD_ID) consulta = consulta.eq('guild_id', process.env.DISCORD_GUILD_ID)
  const { data, error } = await consulta
  if (error) throw error
  return data?.[0] ?? null
}

/** Mensaje privado; si la persona tiene los mensajes directos cerrados, devuelve false y sigue. */
async function mensajeDirecto(client, userId, contenido) {
  const usuario = await client.users.fetch(userId).catch(() => null)
  if (!usuario) return false
  return usuario.send(contenido).then(() => true).catch(() => false)
}

const canal = (client, id) => (id ? client.channels.fetch(id).catch(() => null) : null)

/** Beta testers aprobados en un servidor. */
async function contarAprobadas(guildId) {
  const { count, error } = await supabase()
    .from('discord_beta_applications').select('*', { count: 'exact', head: true }).eq('guild_id', guildId).eq('estado', 'aprobada')
  if (error) throw error
  return count ?? 0
}

/** Actividad de cada cuenta vinculada (si anotó hoy y su último día anotado), por usuario de Discord. */
async function actividad() {
  const { data, error } = await supabase().rpc('actividad_discord')
  if (error) throw error
  return new Map((data ?? []).map((a) => [a.discord_user_id, a]))
}

// ---------------------------------------------------------------------
// Seguimiento automático de beta testers (todos los días a las 10:00)
// ---------------------------------------------------------------------
async function seguimientoBeta(client) {
  try {
    const cfg = await configPrincipal()
    if (!cfg) return
    const hoy = R.hoyChile()
    const { data: testers, error } = await supabase()
      .from('discord_beta_applications')
      .select('id, discord_user_id, revisado_at, seguimiento_dia, aviso_inactivo_at')
      .eq('guild_id', cfg.guild_id).eq('estado', 'aprobada')
    if (error) throw error
    const act = await actividad()
    const inactivos = []
    const sinVincular = []
    for (const p of testers ?? []) {
      if (!p.revisado_at) continue
      const aprobadoEl = R.hoyChile(new Date(p.revisado_at))
      const dias = R.diasEntre(aprobadoEl, hoy)
      const toca = R.proximoSeguimiento(dias, p.seguimiento_dia)
      if (toca) {
        await mensajeDirecto(client, p.discord_user_id, R.MENSAJE_SEGUIMIENTO[toca])
        // Se marca aunque tenga los mensajes cerrados: así no se reintenta cada día.
        await supabase().from('discord_beta_applications').update({ seguimiento_dia: toca }).eq('id', p.id)
      }
      const a = act.get(p.discord_user_id)
      if (!a) {
        // Sin cuenta vinculada no sabemos si anota: se avisa al equipo al día 2 y al día 5.
        if (dias === 2 || dias === 5) sinVincular.push(p)
        continue
      }
      const avisadoEl = p.aviso_inactivo_at ? R.hoyChile(new Date(p.aviso_inactivo_at)) : null
      if (R.debeAvisarInactivo({ hoy, aprobadoEl, ultimoRegistro: a.ultimo_registro, avisadoEl })) {
        inactivos.push({ p, dias: R.diasSinAnotar(a.ultimo_registro, hoy, aprobadoEl) })
        await supabase().from('discord_beta_applications').update({ aviso_inactivo_at: new Date().toISOString() }).eq('id', p.id)
      }
    }
    if (!inactivos.length && !sinVincular.length) return
    const destino = await canal(client, cfg.postulaciones_channel_id)
    if (!destino) return
    const embed = embedKaibu(COLOR.ambar).setTitle('🧪 Seguimiento de la beta')
    if (inactivos.length) {
      embed.addFields({
        name: `😴 Llevan ${R.DIAS_INACTIVO}+ días sin anotar`,
        value: truncar(inactivos.map(({ p, dias }) => `• <@${p.discord_user_id}> · ${dias} días`).join('\n'), 1024),
      })
    }
    if (sinVincular.length) {
      embed.addFields({ name: '🔗 Aún no vinculan su cuenta', value: truncar(sinVincular.map((p) => `• <@${p.discord_user_id}>`).join('\n'), 1024) })
    }
    embed.setDescription('Un mensaje amable basta (hay textos listos en la guía). Si no responde, puedes liberar su cupo.')
    await destino.send({ embeds: [embed], allowedMentions: { parse: [] } })
  } catch (e) {
    console.error('Error en el seguimiento de la beta:', e)
  }
}

// ---------------------------------------------------------------------
// Recordatorio de las 21:00 (solo quien lo activó en la app y no anotó hoy)
// ---------------------------------------------------------------------
async function recordatorios(client) {
  try {
    const hoy = R.hoyChile()
    const act = await actividad()
    for (const a of act.values()) {
      if (!R.debeRecordar(a, hoy)) continue
      await mensajeDirecto(
        client,
        a.discord_user_id,
        `🍽️ Hoy aún no anotas nada en **Kaibu**. ¿Lo hacemos en un minuto? ${APP_URL}/agregar\n_Puedes apagar este recordatorio en la app: Más → Comunidad._`,
      )
      await supabase().from('discord_links').update({ recordado_el: hoy }).eq('discord_user_id', a.discord_user_id)
    }
  } catch (e) {
    console.error('Error enviando recordatorios:', e)
  }
}

// ---------------------------------------------------------------------
// "Mi semana" publicada desde la app (cada minuto)
// ---------------------------------------------------------------------
let publicando = false
async function publicarSemanas(client) {
  if (publicando) return
  publicando = true
  try {
    const { data: pendientes, error } = await supabase()
      .from('discord_week_shares').select('*').is('publicado_at', null).order('created_at').limit(10)
    if (error) throw error
    if (!pendientes?.length) return
    const cfg = await configPrincipal()
    const destino = await canal(client, cfg?.progress_channel_id)
    if (!destino) return
    for (const s of pendientes) {
      const { data: link } = await supabase().from('discord_links').select('discord_user_id').eq('user_id', s.user_id).maybeSingle()
      if (link) {
        const t = R.datosTarjetaSemana(s)
        const embed = embedKaibu(COLOR.exito)
          .setTitle(`📈 ${t.titulo}`)
          .setDescription(`<@${link.discord_user_id}> compartió su ${s.periodo === 'semana' ? 'semana' : 'mes'} 💪${t.barra ? `\n${t.barra}` : ''}`)
          .addFields(t.campos.map((c) => ({ ...c, inline: true })))
        await destino.send({ embeds: [embed], allowedMentions: { parse: [] } })
      }
      // Si se desvinculó antes de publicarse, se descarta igual (no queda pendiente para siempre).
      await supabase().from('discord_week_shares').update({ publicado_at: new Date().toISOString() }).eq('id', s.id)
    }
  } catch (e) {
    console.error('Error publicando semanas desde la app:', e)
  } finally {
    publicando = false
  }
}

// ---------------------------------------------------------------------
// Novedades automáticas: la app publica /novedades.json en cada versión (cada hora)
// ---------------------------------------------------------------------
// Versiones ya anunciadas mientras el bot está encendido: aunque falle Supabase, nunca se repite.
const anunciadas = new Set()

/** novedades.json que publica la app en cada versión (o null si no se puede leer). */
async function leerNovedades() {
  const res = await fetch(`${APP_URL}/novedades.json`, { signal: AbortSignal.timeout(10_000) }).catch(() => null)
  if (!res?.ok) return null
  return res.json().catch(() => null)
}

async function anunciarNovedades(client) {
  try {
    const cfg = await configPrincipal()
    if (!cfg?.updates_channel_id) return
    const novedad = await leerNovedades()
    if (!R.novedadPendiente(novedad, cfg.version_anunciada) || anunciadas.has(novedad.version)) return
    const destino = await canal(client, cfg.updates_channel_id)
    if (!destino) return
    // Primero se guarda; si no se puede guardar (p. ej. falta la migración), NO se publica: así no hay spam.
    const { error } = await supabase().from('discord_guild_config').update({ version_anunciada: novedad.version }).eq('guild_id', cfg.guild_id)
    if (error) {
      console.error('No pude guardar la versión anunciada; no publico para no repetir:', error.message)
      return
    }
    anunciadas.add(novedad.version)
    const puntos = novedad.puntos.slice(0, 15).map((p) => `• ${truncar(String(p), 200)}`).join('\n')
    const embed = embedKaibu(COLOR.marca)
      .setTitle(`🚀 Kaibu ${truncar(novedad.version, 40)}${novedad.titulo ? ` · ${truncar(String(novedad.titulo), 120)}` : ''}`)
      .setURL(`${APP_URL}/novedades`)
      .setDescription(truncar(`${puntos}\n\nActualiza la app (ciérrala y ábrela de nuevo) para verlo.`, 4000))
    const rol = cfg.updates_role_id
    await destino.send({ content: rol ? `<@&${rol}>` : undefined, embeds: [embed], allowedMentions: { roles: rol ? [rol] : [] } })
  } catch (e) {
    console.error('Error anunciando novedades:', e)
  }
}

// ---------------------------------------------------------------------
// Aviso por mensaje privado cuando el equipo cambia el estado de lo que enviaste desde la app
// ---------------------------------------------------------------------
async function avisarEstado(client, appFeedbackId, estado) {
  if (!client || !appFeedbackId) return
  try {
    const { data: fb } = await supabase().from('app_feedback').select('user_id, tipo, titulo').eq('id', appFeedbackId).maybeSingle()
    if (!fb) return
    const { data: link } = await supabase().from('discord_links').select('discord_user_id, avisos_dm').eq('user_id', fb.user_id).maybeSingle()
    const texto = R.textoAvisoEstado(estado, fb.tipo, fb.titulo)
    if (link?.avisos_dm && texto) await mensajeDirecto(client, link.discord_user_id, texto)
  } catch (e) {
    console.error('Error avisando el estado de un reporte:', e)
  }
}

// ---------------------------------------------------------------------
// Celebrar en #progreso cuando alguien llega a 7 o 30 días (si lo permitió en la app)
// ---------------------------------------------------------------------
async function celebrarRachas(miembro, cfg, rolesPuestos) {
  const rachas = R.rachasNuevas(rolesPuestos, cfg)
  if (!rachas.length || !cfg.progress_channel_id) return
  const destino = await miembro.guild.channels.fetch(cfg.progress_channel_id).catch(() => null)
  if (!destino) return
  for (const n of rachas) {
    const embed = embedKaibu(n >= 30 ? COLOR.ambar : COLOR.marca)
      .setTitle(n >= 30 ? '⚡ ¡30 días seguidos!' : '🔥 ¡7 días seguidos!')
      .setDescription(`<@${miembro.id}> lleva **${n} días** cumpliendo su plan en Kaibu. ¡Vamos con todo! 💪`)
    await destino.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => null)
  }
}

module.exports = {
  configPrincipal, contarAprobadas, leerNovedades, seguimientoBeta, recordatorios, publicarSemanas, anunciarNovedades, avisarEstado, celebrarRachas,
}
