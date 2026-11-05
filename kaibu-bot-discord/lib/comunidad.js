// Vincular Discord con Kaibu, roles por racha, recordatorio semanal y métricas de la beta.
const { EmbedBuilder, MessageFlags } = require('discord.js')
const { supabase, configServidor, APP_URL, COLOR } = require('./config')
const { codigoValido, truncar } = require('./texto')

const efimero = { flags: MessageFlags.Ephemeral }
// La racha informada por la app vale si se actualizó en los últimos 2 días.
const RACHA_VIGENTE_MS = 2 * 24 * 60 * 60 * 1000

// Freno contra adivinar códigos: 5 intentos cada 10 minutos por persona.
const intentos = new Map()
function puedeIntentar(userId) {
  const ahora = Date.now()
  const r = intentos.get(userId)
  if (!r || ahora - r.desde > 10 * 60 * 1000) {
    intentos.set(userId, { desde: ahora, n: 1 })
    return true
  }
  r.n += 1
  return r.n <= 5
}

/** Roles que le corresponden a alguien según su vínculo y racha. */
function rolesDeseados(cfg, link) {
  if (!link) return new Set()
  const vigente = link.racha_at && Date.now() - new Date(link.racha_at).getTime() < RACHA_VIGENTE_MS
  const racha = vigente ? link.racha : 0
  const roles = new Set([cfg.atleta_role_id])
  if (racha >= 7) roles.add(cfg.racha7_role_id)
  if (racha >= 30) roles.add(cfg.racha30_role_id)
  roles.delete(null)
  roles.delete(undefined)
  return roles
}

/** Ajusta los roles de comunidad de un miembro (solo los 3 que maneja el bot). */
async function aplicarRoles(miembro, cfg, link) {
  const manejados = [cfg.atleta_role_id, cfg.racha7_role_id, cfg.racha30_role_id].filter(Boolean)
  const deseados = rolesDeseados(cfg, link)
  const poner = manejados.filter((r) => deseados.has(r) && !miembro.roles.cache.has(r))
  const quitar = manejados.filter((r) => !deseados.has(r) && miembro.roles.cache.has(r))
  if (poner.length) await miembro.roles.add(poner, 'Kaibu: cuenta vinculada y racha')
  if (quitar.length) await miembro.roles.remove(quitar, 'Kaibu: cuenta desvinculada o racha cortada')
}

async function vincular(interaction) {
  await interaction.deferReply(efimero)
  if (!puedeIntentar(interaction.user.id)) return interaction.editReply('Demasiados intentos. Espera 10 minutos y genera un código nuevo en la app.')
  const codigo = codigoValido(interaction.options.getString('codigo'))
  if (!codigo) return interaction.editReply('Ese código no tiene el formato correcto: son 6 letras o números, como `K7M2QX`.')
  const { data: userId, error } = await supabase().rpc('canjear_codigo_discord', {
    p_codigo: codigo,
    p_discord_user_id: interaction.user.id,
    p_discord_tag: truncar(interaction.user.username, 100),
  })
  if (error) throw error
  if (!userId) return interaction.editReply(`Código inválido o vencido (duran 10 minutos). Genera uno nuevo en Kaibu → Más → Comunidad: ${APP_URL}`)
  const cfg = await configServidor(interaction.guildId)
  const { data: link } = await supabase().from('discord_links').select('*').eq('user_id', userId).single()
  if (cfg) await aplicarRoles(interaction.member, cfg, link).catch((e) => console.error('No pude poner roles:', e))
  return interaction.editReply('✅ ¡Cuenta vinculada! Ya tienes el rol 💪 Atleta Kaibu. Los roles de racha 🔥 7+ y ⚡ 30+ días se actualizan solos cada vez que abres la app.')
}

async function desvincular(interaction) {
  await interaction.deferReply(efimero)
  const { data, error } = await supabase().from('discord_links').delete().eq('discord_user_id', interaction.user.id).select('user_id')
  if (error) throw error
  const cfg = await configServidor(interaction.guildId)
  if (cfg) await aplicarRoles(interaction.member, cfg, null).catch(() => {})
  return interaction.editReply(data?.length ? 'Listo, tu Discord ya no está unido a tu cuenta de Kaibu.' : 'Tu Discord no estaba vinculado con ninguna cuenta de Kaibu.')
}

let sincronizando = false

/** Cada 15 minutos: roles de quienes vincularon su cuenta (y los quita a quien se desvinculó o borró su cuenta). */
async function sincronizarRoles(client) {
  if (sincronizando) return
  sincronizando = true
  try {
    const { data: configs } = await supabase().from('discord_guild_config').select('*')
    const { data: links, error } = await supabase().from('discord_links').select('discord_user_id, racha, racha_at')
    if (error) throw error
    const porDiscord = new Map((links ?? []).map((l) => [l.discord_user_id, l]))
    for (const cfg of configs ?? []) {
      if (!cfg.atleta_role_id) continue
      const guild = await client.guilds.fetch(cfg.guild_id).catch(() => null)
      if (!guild) continue
      const miembros = await guild.members.fetch()
      for (const miembro of miembros.values()) {
        if (miembro.user.bot) continue
        const link = porDiscord.get(miembro.id) ?? null
        const tieneAlguno = [cfg.atleta_role_id, cfg.racha7_role_id, cfg.racha30_role_id].some((r) => r && miembro.roles.cache.has(r))
        if (link || tieneAlguno) await aplicarRoles(miembro, cfg, link).catch((e) => console.error(`Roles de ${miembro.id}:`, e.message))
      }
    }
  } catch (e) {
    console.error('Error sincronizando roles:', e)
  } finally {
    sincronizando = false
  }
}

/** Domingo 20:00 (Chile): recordatorio del ajuste semanal (RN-11) en #general. */
async function recordatorioDominical(client) {
  try {
    const { data: configs } = await supabase().from('discord_guild_config').select('*')
    for (const cfg of configs ?? []) {
      const canal = cfg.general_channel_id && (await client.channels.fetch(cfg.general_channel_id).catch(() => null))
      if (!canal) continue
      await canal.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚖️ Domingo de revisión en Kaibu')
            .setDescription(
              'El peso de un día sube y baja por agua y sodio. Kaibu mira tu **promedio de 7 días** y, si tu ritmo se desvió 2 semanas, te sugiere ajustar tu meta gratis.\n\n' +
                '1️⃣ Anota tu peso en ayunas y toca **Terminar día**.\n' +
                '2️⃣ Revisa la sugerencia de ajuste en **Hoy** o **Mi plan**.\n' +
                (cfg.progress_channel_id ? `3️⃣ Comparte tu semana (Progreso → Compartir mi semana) en <#${cfg.progress_channel_id}>.` : ''),
            )
            .setColor(COLOR.marca)
            .setFooter({ text: 'Te cobran por que tu plan se adapte a ti. Kaibu lo adapta gratis.' }),
        ],
      })
    }
  } catch (e) {
    console.error('Error en el recordatorio dominical:', e)
  }
}

async function metricas(interaction) {
  await interaction.deferReply(efimero)
  const cuenta = (tabla, filtro) => {
    let q = supabase().from(tabla).select('*', { count: 'exact', head: true })
    if (filtro) q = filtro(q)
    return q.then((r) => r.count ?? 0)
  }
  const [bugs, bugsPend, sugs, sugsApp, encuesta, encuestaSi, vinculados] = await Promise.all([
    cuenta('discord_bug_reports'),
    cuenta('discord_bug_reports', (q) => q.eq('status', 'pendiente')),
    cuenta('discord_suggestions'),
    cuenta('discord_suggestions', (q) => q.eq('origen', 'app')),
    cuenta('discord_beta_survey'),
    cuenta('discord_beta_survey', (q) => q.eq('would_pay', true)),
    cuenta('discord_links'),
  ])
  const pct = encuesta ? Math.round((encuestaSi / encuesta) * 100) : 0
  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('📈 Tablero de la beta')
        .addFields(
          { name: '🐛 Bugs', value: `${bugsPend} pendientes de ${bugs}`, inline: true },
          { name: '💡 Sugerencias', value: `${sugs} (${sugsApp} desde la app)`, inline: true },
          { name: '🔗 Cuentas vinculadas', value: String(vinculados), inline: true },
          { name: '📊 Pagaría $2.990 al mes (meta 40 %)', value: `**${pct} %** (${encuestaSi} de ${encuesta} respuestas)` },
        )
        .setColor(COLOR.exito),
    ],
  })
}

module.exports = { vincular, desvincular, sincronizarRoles, recordatorioDominical, metricas, rolesDeseados }
