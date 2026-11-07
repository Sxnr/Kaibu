// Invitaciones: links de cada red social (TikTok, Instagram, YouTube) y links personales de cada miembro.
// Al entrar alguien, el bot compara los usos de cada link para saber con cuál llegó. Cuenta para el ranking
// solo cuando acepta las reglas. El día 1 de cada mes se publica el top 3 y el primero recibe 🤝 Embajador Kaibu.
const { MessageFlags, PermissionFlagsBits } = require('discord.js')
const { supabase, configServidor, COLOR } = require('./config')
const { esDelEquipo } = require('./permisos')
const { mensajeV2 } = require('./v2')

const efimero = { flags: MessageFlags.Ephemeral }
// Links de las bios de cada red (los creó Francisco en Discord).
const REDES = { RzVeSeDnu: 'tiktok', mnWJ9WjTS: 'instagram', jzqXurCnnM: 'youtube' }
const NOMBRE_RED = { tiktok: '🎵 TikTok', instagram: '📸 Instagram', youtube: '▶️ YouTube' }
const ROL_EMBAJADOR = '🤝 Embajador Kaibu'
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/* ---------- Lógica pura ---------- */

/** Con qué link entró alguien: el primero cuyo uso subió respecto de la foto anterior. */
function detectarInvitacion(antes, despues) {
  for (const { code, uses } of despues) {
    if ((uses ?? 0) > (antes.get(code) ?? 0)) return code
  }
  return null
}

/** Mes anterior a una fecha YYYY-MM-DD: { desde, hasta, nombre } (hasta = día 1 del mes actual). */
function mesAnterior(hoy) {
  const [a, m] = hoy.split('-').map(Number)
  const anio = m === 1 ? a - 1 : a
  const mes = m === 1 ? 12 : m - 1
  const dos = (n) => String(n).padStart(2, '0')
  return { desde: `${anio}-${dos(mes)}-01`, hasta: `${a}-${dos(m)}-01`, nombre: `${MESES[mes - 1]} ${anio}` }
}

/** Ranking: personas que más gente trajeron (solo entradas verificadas). */
function ranking(entradas, duenos, limite = 3) {
  const cuenta = new Map()
  for (const e of entradas) {
    const id = duenos.get(e.code)
    if (!id || !e.verificado_at) continue
    cuenta.set(id, (cuenta.get(id) ?? 0) + 1)
  }
  return [...cuenta.entries()].map(([id, n]) => ({ id, n })).sort((x, y) => y.n - x.n).slice(0, limite)
}

/* ---------- Usos de cada link (en memoria) ---------- */

const usos = new Map() // guildId → Map(code → uses)

async function fotoUsos(guild) {
  const lista = await guild.invites.fetch({ cache: false })
  return [...lista.values()].map((i) => ({ code: i.code, uses: i.uses ?? 0 }))
}

/** Al encender: guarda cuántos usos tiene cada link y registra los de las redes. */
async function prepararInvitaciones(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) continue
      const foto = await fotoUsos(guild)
      usos.set(guild.id, new Map(foto.map((x) => [x.code, x.uses])))
      const filas = Object.entries(REDES).filter(([code]) => foto.some((x) => x.code === code)).map(([code, red]) => ({ code, guild_id: guild.id, red }))
      if (filas.length) await supabase().from('discord_invites').upsert(filas, { onConflict: 'code' })
    } catch (e) {
      console.error('No pude leer las invitaciones:', e.message)
    }
  }
}

/** Alguien entró: se anota con qué link (si es de una red o de un miembro). */
async function alEntrar(miembro) {
  if (miembro.user.bot) return
  try {
    const guild = miembro.guild
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) return
    const antes = usos.get(guild.id) ?? new Map()
    const despues = await fotoUsos(guild)
    usos.set(guild.id, new Map(despues.map((x) => [x.code, x.uses])))
    const code = detectarInvitacion(antes, despues)
    if (!code) return
    const { data: link } = await supabase().from('discord_invites').select('code').eq('code', code).maybeSingle()
    if (!link) return // link sin dueño ni red (ej.: el de la app): no cuenta
    await supabase().from('discord_invite_joins').upsert({ guild_id: guild.id, member_id: miembro.id, code }, { onConflict: 'guild_id,member_id', ignoreDuplicates: true })
  } catch (e) {
    console.error('No pude registrar con qué link entró alguien:', e.message)
  }
}

/** Aceptó las reglas: recién ahora cuenta para el ranking. */
async function marcarVerificado(guildId, memberId) {
  await supabase().from('discord_invite_joins').update({ verificado_at: new Date().toISOString() }).eq('guild_id', guildId).eq('member_id', memberId).is('verificado_at', null)
}

/* ---------- Comandos ---------- */

/** /mi-invitacion: el link personal de cada miembro (siempre el mismo) y cuántos trajo. */
async function miInvitacion(interaction) {
  await interaction.deferReply(efimero)
  const guild = interaction.guild
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.editReply('El bot necesita el permiso "Gestionar servidor" para crear links. Avísale al equipo.')
  const cfg = await configServidor(guild.id)
  const { data: fila } = await supabase().from('discord_invites').select('code').eq('guild_id', guild.id).eq('discord_user_id', interaction.user.id).maybeSingle()
  let code = fila?.code
  const vigente = code && (await guild.invites.fetch({ code, cache: false }).catch(() => null))
  if (!vigente) {
    const canal = await guild.channels.fetch(cfg?.verificacion_channel_id).catch(() => null)
    if (!canal) return interaction.editReply('Falta configurar el servidor (/setup).')
    const inv = await canal.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: `Link personal de ${interaction.user.tag}` })
    if (code) await supabase().from('discord_invites').delete().eq('code', code)
    code = inv.code
    const { error } = await supabase().from('discord_invites').insert({ code, guild_id: guild.id, discord_user_id: interaction.user.id })
    if (error) throw error
    usos.get(guild.id)?.set(code, 0)
  }
  const { count } = await supabase().from('discord_invite_joins').select('id', { count: 'exact', head: true }).eq('code', code).not('verificado_at', 'is', null)
  return interaction.editReply(
    `🤝 **Tu link para invitar:** https://discord.gg/${code}\n` +
      `Ya trajiste a **${count ?? 0}** ${count === 1 ? 'persona' : 'personas'} (cuentan cuando aceptan las reglas).\n` +
      `-# El día 1 de cada mes destacamos a quien trajo más gente, con el rol ${ROL_EMBAJADOR}.`,
  )
}

/** /invitaciones (equipo): cuánta gente llegó por cada red y el top del mes. */
async function invitaciones(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const roles = interaction.member?.roles?.cache ?? new Map()
  if (!esDelEquipo(roles, cfg, interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))) {
    return interaction.reply({ content: 'Solo el 🛡️ Equipo Kaibu puede ver las invitaciones.', ...efimero })
  }
  await interaction.deferReply(efimero)
  const foto = await fotoUsos(interaction.guild).catch(() => [])
  const { data: links } = await supabase().from('discord_invites').select('code, red, discord_user_id').eq('guild_id', interaction.guildId)
  const { data: entradas } = await supabase().from('discord_invite_joins').select('code, verificado_at, joined_at').eq('guild_id', interaction.guildId)
  const lineasRedes = Object.entries(REDES).map(([code, red]) => {
    const clics = foto.find((x) => x.code === code)?.uses ?? 0
    const verificados = (entradas ?? []).filter((e) => e.code === code && e.verificado_at).length
    return `${NOMBRE_RED[red]}: **${clics}** entraron · **${verificados}** aceptaron las reglas`
  })
  const inicioMes = `${new Date().toISOString().slice(0, 7)}-01`
  const duenos = new Map((links ?? []).filter((l) => l.discord_user_id).map((l) => [l.code, l.discord_user_id]))
  const top = ranking((entradas ?? []).filter((e) => e.verificado_at >= inicioMes), duenos, 5)
  return interaction.editReply(
    mensajeV2({
      acento: COLOR.info,
      piezas: [
        { texto: '## 🔗 Invitaciones' },
        { separador: true },
        { texto: `**Por red social**\n${lineasRedes.join('\n')}` },
        { separador: true },
        { texto: `**Top del mes (miembros)**\n${top.length ? top.map((t, i) => `${i + 1}. <@${t.id}> · ${t.n}`).join('\n') : 'Aún nadie trae gente este mes.'}` },
        { texto: '-# "Entraron" cuenta clics que terminaron en el servidor; "aceptaron" es gente que se quedó.' },
      ],
    }),
  )
}

/* ---------- Ranking mensual ---------- */

/** Día 1 a las 12:00: top 3 del mes anterior en #general y rol 🤝 Embajador Kaibu al primero. */
async function rankingMensual(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const cfg = await configServidor(guild.id)
      if (!cfg?.general_channel_id) continue
      const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' })
      const mes = mesAnterior(hoy)
      const { data: links } = await supabase().from('discord_invites').select('code, discord_user_id').eq('guild_id', guild.id).not('discord_user_id', 'is', null)
      const { data: entradas } = await supabase()
        .from('discord_invite_joins').select('code, verificado_at').eq('guild_id', guild.id)
        .gte('verificado_at', mes.desde).lt('verificado_at', mes.hasta)
      const top = ranking(entradas ?? [], new Map((links ?? []).map((l) => [l.code, l.discord_user_id])), 3)
      if (top.length === 0) continue
      const rol = guild.roles.cache.find((r) => r.name === ROL_EMBAJADOR)
      if (rol) {
        for (const m of rol.members.values()) await m.roles.remove(rol, 'Kaibu: nuevo mes de embajadores').catch(() => null)
        const ganador = await guild.members.fetch(top[0].id).catch(() => null)
        if (ganador) await ganador.roles.add(rol, `Kaibu: quien más invitó en ${mes.nombre}`).catch(() => null)
      }
      const canal = await guild.channels.fetch(cfg.general_channel_id).catch(() => null)
      const medallas = ['🥇', '🥈', '🥉']
      await canal?.send(
        mensajeV2({
          acento: COLOR.exito,
          menciones: { users: top.map((t) => t.id) },
          piezas: [
            { texto: `# 🤝 Embajadores de ${mes.nombre}` },
            { separador: true },
            { texto: top.map((t, i) => `${medallas[i]} <@${t.id}> trajo a **${t.n}** ${t.n === 1 ? 'persona' : 'personas'}`).join('\n') },
            { texto: `¡Gracias por hacer crecer la comunidad! <@${top[0].id}> lleva el rol **${ROL_EMBAJADOR}** este mes.` },
            { separador: true },
            { texto: '-# ¿Quieres participar? Escribe `/mi-invitacion` y comparte tu link.' },
          ],
        }),
      )
    } catch (e) {
      console.error('Error publicando el ranking de invitaciones:', e.message)
    }
  }
}

module.exports = {
  REDES, ROL_EMBAJADOR, detectarInvitacion, mesAnterior, ranking,
  prepararInvitaciones, alEntrar, marcarVerificado, miInvitacion, invitaciones, rankingMensual,
}
