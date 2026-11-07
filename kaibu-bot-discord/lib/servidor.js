// /setup e /invitacion: crea o repara la comunidad sin duplicar canales, roles ni paneles.
// Al entrar solo se ve #verificación; al aceptar las reglas se recibe 👤 Miembro.
// También corre solo al encender el bot (autoSetup), así el servidor queda siempre al día.
const { ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js')
const { supabase, configServidor } = require('./config')
const { permisosCanal } = require('./permisos')
const { traerMiembros } = require('./miembros')
const { contarAprobadas, leerNovedades } = require('./conectada')
const { posicionesServidor } = require('./reglas')
const { textoV2 } = require('./v2')
const paneles = require('./paneles')
const { configurarComunidad } = require('./comunidad-discord')
const { asegurarRolesRegion } = require('./regiones')

const P = PermissionFlagsBits
const efimero = { flags: MessageFlags.Ephemeral }

// Los nombres de los primeros roles y canales se mantienen: así se reconocen los que ya existen.
const ROLES = [
  { clave: 'miembro_role_id', nombre: '👤 Miembro', color: '#A39A98' },
  { clave: 'equipo_role_id', nombre: '🛡️ Equipo Kaibu', color: '#E8B04B', hoist: true },
  { clave: 'tester_role_id', nombre: '🧪 Beta Tester', color: '#5AB0E6', hoist: true },
  { clave: 'updates_role_id', nombre: '🔔 Ping Novedades', color: '#3FBF7F' },
  { clave: 'racha7_role_id', nombre: '🔥 Racha 7+ Días', color: '#F97316' },
  { clave: 'racha30_role_id', nombre: '⚡ Racha 30+ Días', color: '#E8B04B' },
  { clave: 'atleta_role_id', nombre: '💪 Atleta Kaibu', color: '#B3202A' },
  { clave: 'tiktok_role_id', nombre: '🎥 Ping TikTok', color: '#E8B04B' },
  { clave: 'lanzamiento_role_id', nombre: '📣 Ping Lanzamiento', color: '#D1343C' },
]
// Roles que se buscan por nombre (no necesitan columna en la base).
const ROLES_EXTRA = [{ nombre: '🤝 Embajador Kaibu', color: '#8CC084', hoist: true }]

// tipo = quién ve y quién escribe (ver lib/permisos.js); tema = descripción del canal; plantilla = panel fijo.
// El orden de esta lista es el orden en Discord: arriba lo que se lee, al medio donde se conversa y abajo lo privado.
const ESTRUCTURA = [
  {
    nombre: '✅ EMPIEZA AQUÍ',
    tipo: 'publicoLectura',
    canales: [
      { clave: 'verificacion_channel_id', nombre: '✅・verificación', tipo: 'verificacion', tema: 'Acepta las reglas con el botón y se abre toda la comunidad.' },
      { clave: 'bienvenidas_channel_id', nombre: '👋・bienvenidas', tipo: 'publicoLectura', tema: 'Cada persona que llega recibe su banner de bienvenida. ¡Salúdala!' },
      // Antes "👋・bienvenida-y-reglas": se renombra (mismo canal, mismo ID).
      { clave: 'welcome_channel_id', nombre: 'ℹ️・información', tipo: 'info', tema: 'Qué es Kaibu, la beta, cómo moverte, tu región y avisos opcionales.' },
      { clave: 'reglas_channel_id', nombre: '📜・reglas', tipo: 'publicoLectura', tema: 'Cómo convivimos: respeto, salud y moderación.' },
    ],
  },
  {
    nombre: '📣 KAIBU AL DÍA',
    tipo: 'info',
    canales: [
      { clave: 'anuncios_channel_id', nombre: '📣・anuncios', tipo: 'info', tema: 'Avisos importantes del equipo de Kaibu.' },
      { clave: 'updates_channel_id', nombre: '🚀・novedades-app', tipo: 'info', tema: 'Cada versión grande de la app, con lo nuevo. Activa 🔔 Novedades en #información.' },
      { clave: 'roadmap_channel_id', nombre: '🗺️・roadmap-sprints', tipo: 'info', tema: 'La versión actual de Kaibu y lo que viene. Se actualiza solo.' },
      { clave: 'redes_channel_id', nombre: '🎥・kaibu-en-redes', tipo: 'comunidadLectura', tema: 'Nuestros videos de TikTok, Instagram y YouTube. ¡Coméntalos y compártelos!' },
    ],
  },
  {
    nombre: '💪 COMUNIDAD & PROGRESO',
    tipo: 'comunidad',
    canales: [
      { clave: 'presentate_channel_id', nombre: '🙋・preséntate', tipo: 'comunidad', plantilla: 'presentate', tema: 'Cuéntanos quién eres y tu meta. Toca "Presentarme" o usa /presentarme.' },
      { clave: 'general_channel_id', nombre: '💬・general', tipo: 'comunidad', tema: 'Conversa de todo: comida, gym, rutina y vida. Cada miércoles, encuesta chilena.' },
      { clave: 'dato_channel_id', nombre: '☀️・dato-del-día', tipo: 'comunidadLectura', tema: 'Un dato de nutrición cada mañana a las 8:30. Comenta en el hilo.' },
      { clave: 'desafio_channel_id', nombre: '🎯・desafío-semanal', tipo: 'comunidadLectura', tema: 'Un reto cada lunes. Súmate con ✅ y cuenta cómo te va en el hilo.' },
      { clave: 'progress_channel_id', nombre: '📈・tarjetas-de-progreso', tipo: 'comunidad', plantilla: 'progreso', tema: 'Tus semanas y tus rachas, publicadas desde la app.' },
      { nombre: '🏋️・gym-y-cargas', tipo: 'comunidad', plantilla: 'gym', tema: 'Rutinas, técnica y tus PR. Prueba /progresion-gym.' },
      { nombre: '🥑・mesa-chilena-y-recetas', tipo: 'comunidad', plantilla: 'recetas', tema: 'Recetas caseras y fit. Calcula cada ingrediente con /alimento.' },
      { clave: 'preguntas_channel_id', nombre: '❓・preguntas', tipo: 'comunidad', plantilla: 'preguntas', tema: 'Dudas de nutrición, gym o la app. Orientación, no consejo médico.' },
      { nombre: '😂・off-topic', tipo: 'comunidad', tema: 'Memes y todo lo demás (con respeto).' },
      { nombre: '🔊 Entrenando juntos', tipo: 'voz', voz: true },
    ],
  },
  {
    nombre: '🧪 BETA & FEEDBACK',
    tipo: 'beta',
    canales: [
      { clave: 'feedback_channel_id', nombre: '🛠️・centro-de-feedback', tipo: 'betaLectura', tema: 'Reporta bugs, envía sugerencias y responde la encuesta.' },
      { clave: 'suggestions_channel_id', nombre: '💡・sugerencias-comunidad', tipo: 'comunidadLectura', tema: 'Las ideas de la comunidad: vota con los botones.' },
      { nombre: '💬・chat-beta-testers', tipo: 'beta', tema: 'Solo beta testers: cuéntanos cómo te va con la app.' },
    ],
  },
  {
    nombre: '🔒 STAFF & TRIAJE',
    tipo: 'staff',
    canales: [
      { clave: 'bug_triage_channel_id', nombre: '🐛・triaje-bugs', tipo: 'staff' },
      { clave: 'postulaciones_channel_id', nombre: '🧪・postulaciones-beta', tipo: 'staff' },
      { clave: 'survey_logs_channel_id', nombre: '📊・resultados-on09', tipo: 'staff' },
      // Discord manda aquí sus avisos de Comunidad (requisito del modo Comunidad).
      { nombre: '🛡️・avisos-discord', tipo: 'staff', tema: 'Avisos de Discord para administradores de la comunidad.' },
    ],
  },
]

// Categorías del primer /setup que quedan vacías al reordenar: se borran solo si no tienen canales.
const CATEGORIAS_VIEJAS = ['✅ VERIFICACIÓN', '📌 INFORMACIÓN KAIBU']

/** Convierte la lista de permisos (nombres) al formato de discord.js. */
const aOverwrites = (lista) => lista.map((o) => ({ id: o.id, allow: o.allow.map((n) => P[n]), deny: o.deny.map((n) => P[n]) }))

async function buscarOCrearRol(guild, cfg, def, cuenta) {
  const existente = (def.clave && cfg?.[def.clave] && guild.roles.cache.get(cfg[def.clave])) || guild.roles.cache.find((r) => r.name === def.nombre)
  if (existente) return existente
  cuenta.creados += 1
  return guild.roles.create({ name: def.nombre, colors: { primaryColor: def.color }, hoist: Boolean(def.hoist), reason: 'Kaibu /setup' })
}

/**
 * Busca el canal (por ID guardado o por nombre) o lo crea. Si existe, deja al día su nombre, su categoría,
 * su posición, su descripción y sus permisos (así /setup reordena el servidor sin borrar canales ni mensajes).
 */
async function asegurarCanal(guild, { id, nombre, tipo, padre, permisos, posicion, tema }, cuenta) {
  const existente =
    (id && guild.channels.cache.get(id)) ||
    guild.channels.cache.find((c) => c.name === nombre && c.type === tipo && (tipo === ChannelType.GuildCategory || c.parentId === (padre?.id ?? null))) ||
    (tipo !== ChannelType.GuildCategory && guild.channels.cache.find((c) => c.name === nombre && c.type === tipo))
  if (!existente) {
    cuenta.creados += 1
    return guild.channels.create({ name: nombre, type: tipo, parent: padre?.id, permissionOverwrites: permisos, position: posicion, topic: tema, reason: 'Kaibu /setup' })
  }
  const motivo = 'Kaibu /setup: orden del servidor'
  if (existente.name !== nombre) await existente.setName(nombre, motivo).catch(() => null)
  if (padre && existente.parentId !== padre.id) await existente.setParent(padre.id, { lockPermissions: false, reason: motivo }).catch(() => null)
  if (posicion !== undefined && existente.position !== posicion) await existente.setPosition(posicion, { reason: motivo }).catch(() => null)
  if (tema && existente.type === ChannelType.GuildText && existente.topic !== tema) await existente.setTopic(tema, motivo).catch(() => null)
  await existente.permissionOverwrites.set(permisos, 'Kaibu /setup: permisos por rol')
  return existente
}

/** Borra las categorías del primer /setup que quedaron vacías al reordenar. */
async function limpiarCategoriasViejas(guild) {
  for (const nombre of CATEGORIAS_VIEJAS) {
    const cat = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === nombre)
    if (cat && !guild.channels.cache.some((c) => c.parentId === cat.id)) await cat.delete('Kaibu /setup: categoría vacía tras reordenar').catch(() => null)
  }
}

const esV2 = (m) => m.flags?.has(MessageFlags.IsComponentsV2)

/**
 * Publica o actualiza el panel de un canal. Lo reconoce por su título (`marca`).
 * `legado`: en los canales que solo tenían el panel antiguo (embed), ese mensaje se reemplaza por el nuevo.
 * Devuelve true si publicó uno nuevo (para fijarlo).
 */
async function asegurarPanel(canal, botId, contenido, { marca, legado = false } = {}) {
  const mensajes = await canal.messages.fetch({ limit: 50 })
  const delBot = [...mensajes.values()].filter((m) => m.author.id === botId).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  const actual = delBot.find((m) => esV2(m) && (!marca || textoV2(m.components).includes(JSON.stringify(marca).slice(1, -1))))
  if (actual) {
    await actual.edit({ components: contenido.components, files: contenido.files, attachments: [], allowedMentions: contenido.allowedMentions })
    return false
  }
  if (legado) {
    // El panel antiguo (embed) era el primer mensaje del bot en el canal.
    const viejo = delBot.find((m) => !esV2(m) && m.embeds.length > 0)
    if (viejo) await viejo.delete().catch(() => null)
  }
  const nuevo = await canal.send(contenido)
  return nuevo
}

/** Publica la plantilla de un canal y la fija (solo la primera vez). */
async function asegurarPlantilla(canal, botId, tipo) {
  const crear = paneles.PLANTILLAS[tipo]
  if (!crear) return
  const nuevo = await asegurarPanel(canal, botId, crear(), { marca: paneles.TITULOS[tipo] })
  if (nuevo && typeof nuevo.pin === 'function') await nuevo.pin('Kaibu: plantilla del canal').catch(() => null)
}

/** Link permanente de invitación (lo usa la app en "Únete a la comunidad"). */
async function asegurarInvitacion(guild, cfg, canal) {
  if (cfg?.invite_url) {
    const codigo = cfg.invite_url.split('/').pop()
    const vigente = await guild.invites.fetch({ code: codigo, cache: false }).catch(() => null)
    if (vigente) return cfg.invite_url
  }
  const inv = await canal.createInvite({ maxAge: 0, maxUses: 0, unique: false, reason: 'Link de la app Kaibu' })
  return inv.url
}

/** Quienes ya estaban antes de la verificación reciben 👤 Miembro, para que no pierdan los canales. */
async function darMiembroATodos(guild, rolMiembro) {
  const miembros = await traerMiembros(guild)
  let n = 0
  for (const m of miembros.values()) {
    if (m.user.bot || m.roles.cache.has(rolMiembro)) continue
    await m.roles.add(rolMiembro, 'Kaibu /setup: ya era parte del servidor').catch(() => null)
    n += 1
  }
  return n
}

const PERMISOS_NECESARIOS = [['Gestionar roles', P.ManageRoles], ['Gestionar canales', P.ManageChannels], ['Crear invitación', P.CreateInstantInvite]]

/**
 * Arma o repara todo el servidor: roles, canales con su descripción, paneles, plantillas,
 * regiones y la configuración de Comunidad. Devuelve el resumen (texto) para quien lo pidió.
 */
async function configurarServidor(guild) {
  const yo = guild.members.me
  const faltan = PERMISOS_NECESARIOS.filter(([, p]) => !yo.permissions.has(p)).map(([n]) => n)
  if (faltan.length > 0) {
    return `⚠️ Al bot le faltan permisos: **${faltan.join(', ')}**. Dáselos en Ajustes del servidor → Roles y vuelve a ejecutar /setup.`
  }

  await Promise.all([guild.roles.fetch(), guild.channels.fetch()])
  const cfg = await configServidor(guild.id)
  const cuenta = { creados: 0 }
  const ids = { guild_id: guild.id }
  for (const def of ROLES) ids[def.clave] = (await buscarOCrearRol(guild, cfg, def, cuenta)).id
  for (const def of ROLES_EXTRA) await buscarOCrearRol(guild, cfg, def, cuenta)
  cuenta.creados += await asegurarRolesRegion(guild)

  const roles = { everyone: guild.id, bot: yo.id, miembro: ids.miembro_role_id, tester: ids.tester_role_id, equipo: ids.equipo_role_id }
  const canales = {}
  const plantillas = []
  const porNombre = {}
  const orden = []
  for (const [n, cat] of ESTRUCTURA.entries()) {
    const categoria = await asegurarCanal(
      guild,
      { nombre: cat.nombre, tipo: ChannelType.GuildCategory, permisos: aOverwrites(permisosCanal(cat.tipo, roles)), posicion: n },
      cuenta,
    )
    const grupo = { categoria: categoria.id, canales: [] }
    orden.push(grupo)
    for (const [m, def] of cat.canales.entries()) {
      const canal = await asegurarCanal(
        guild,
        {
          id: def.clave && cfg?.[def.clave],
          nombre: def.nombre,
          tipo: def.voz ? ChannelType.GuildVoice : ChannelType.GuildText,
          padre: categoria,
          permisos: aOverwrites(permisosCanal(def.tipo, roles)),
          posicion: m,
          tema: def.tema,
        },
        cuenta,
      )
      grupo.canales.push(canal.id)
      porNombre[def.nombre] = canal
      if (def.clave) {
        ids[def.clave] = canal.id
        canales[def.clave] = canal
      }
      if (def.plantilla) plantillas.push([canal, def.plantilla])
    }
  }
  await limpiarCategoriasViejas(guild)
  // Orden final en una sola llamada: así "Kaibu al día" queda arriba aunque sea una categoría nueva.
  await guild.channels.setPositions(posicionesServidor(orden)).catch((e) => console.error('No pude ordenar el servidor:', e.message))

  const nuevaCfg = { ...cfg, ...ids }
  const legado = { legado: true }
  await asegurarPanel(canales.verificacion_channel_id, yo.id, paneles.panelVerificacion(nuevaCfg), { marca: paneles.TITULOS.verificacion, ...legado })
  await asegurarPanel(canales.welcome_channel_id, yo.id, paneles.panelInformacion(nuevaCfg, await contarAprobadas(guild.id)), { marca: paneles.TITULOS.informacion, ...legado })
  await asegurarPanel(canales.reglas_channel_id, yo.id, paneles.panelReglas(), { marca: paneles.TITULOS.reglas, ...legado })
  await asegurarPanel(canales.roadmap_channel_id, yo.id, paneles.panelRoadmap(await leerNovedades()), { marca: paneles.TITULOS.roadmap, ...legado })
  await asegurarPanel(canales.feedback_channel_id, yo.id, paneles.panelFeedback(nuevaCfg), { marca: paneles.TITULOS.feedback, ...legado })
  for (const [canal, tipo] of plantillas) await asegurarPlantilla(canal, yo.id, tipo).catch((e) => console.error(`No pude publicar la plantilla ${tipo}:`, e.message))
  ids.invite_url = await asegurarInvitacion(guild, cfg, canales.verificacion_channel_id)

  const { error } = await supabase().from('discord_guild_config').upsert(ids, { onConflict: 'guild_id' })
  if (error) throw error

  const comunidad = await configurarComunidad(guild, {
    reglas: ids.reglas_channel_id,
    avisos: porNombre['🛡️・avisos-discord']?.id,
    bienvenidas: ids.bienvenidas_channel_id,
    verificacion: ids.verificacion_channel_id,
  })
  const migrados = await darMiembroATodos(guild, ids.miembro_role_id).catch((e) => {
    console.error('No pude dar 👤 Miembro a los que ya estaban:', e.message)
    return -1
  })

  return (
    `✅ **Comunidad lista** (${cuenta.creados === 0 ? 'no faltaba nada; se actualizaron permisos, descripciones y paneles' : `se crearon ${cuenta.creados} canales o roles que faltaban`}).\n` +
    `• Paneles nuevos en <#${ids.verificacion_channel_id}>, <#${ids.welcome_channel_id}>, <#${ids.reglas_channel_id}>, <#${ids.roadmap_channel_id}> y plantillas fijadas en los canales de la comunidad.\n` +
    `• ${comunidad}\n` +
    (migrados > 0 ? `• ${migrados} personas que ya estaban recibieron 👤 Miembro.\n` : '') +
    (migrados < 0 ? '• ⚠️ Discord pidió esperar: vuelve a ejecutar /setup en un minuto para dar 👤 Miembro a quienes ya estaban.\n' : '') +
    `• Dale el rol <@&${ids.equipo_role_id}> a quien te ayude a revisar postulaciones (cupo actual: ${cfg?.cupo_beta ?? 20}).\n\n` +
    `**Link de invitación para la app:** ${ids.invite_url}\nPégalo en Vercel como \`VITE_DISCORD_INVITE\`.`
  )
}

async function setup(interaction) {
  await interaction.deferReply(efimero)
  return interaction.editReply(await configurarServidor(interaction.guild))
}

/** Al encender: deja al día los servidores que ya pasaron por /setup (no crea nada en servidores nuevos). */
async function autoSetup(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const cfg = await configServidor(guild.id)
      if (!cfg) continue
      const resumen = await configurarServidor(guild)
      console.log(`🔧 Servidor ${guild.name} al día:\n${resumen}`)
    } catch (e) {
      console.error(`No pude poner al día ${guild.name}:`, e.message)
    }
  }
}

/** Actualiza el contador de cupos del panel de información (al aprobar, rechazar o cambiar el cupo). */
async function refrescarBienvenida(guild) {
  const cfg = await configServidor(guild.id)
  if (!cfg?.welcome_channel_id) return
  const canal = await guild.channels.fetch(cfg.welcome_channel_id).catch(() => null)
  if (!canal) return
  await asegurarPanel(canal, guild.members.me.id, paneles.panelInformacion(cfg, await contarAprobadas(guild.id)), { marca: paneles.TITULOS.informacion, legado: true })
}

/** Actualiza el panel "Kaibu hoy" del canal de roadmap con los datos de novedades.json. */
async function refrescarRoadmap(client, cfg, novedad) {
  const canal = cfg?.roadmap_channel_id && (await client.channels.fetch(cfg.roadmap_channel_id).catch(() => null))
  if (!canal) return
  await asegurarPanel(canal, client.user.id, paneles.panelRoadmap(novedad), { marca: paneles.TITULOS.roadmap, legado: true })
}

async function invitacion(interaction) {
  await interaction.deferReply(efimero)
  const cfg = await configServidor(interaction.guildId)
  const canalId = cfg?.verificacion_channel_id ?? cfg?.welcome_channel_id
  if (!canalId) return interaction.editReply('Primero ejecuta /setup.')
  const canal = await interaction.guild.channels.fetch(canalId).catch(() => null)
  if (!canal) return interaction.editReply('No encuentro el canal de entrada. Ejecuta /setup para repararlo.')
  const url = await asegurarInvitacion(interaction.guild, cfg, canal)
  if (url !== cfg.invite_url) await supabase().from('discord_guild_config').update({ invite_url: url }).eq('guild_id', interaction.guildId)
  return interaction.editReply(`🔗 ${url}\nEs permanente. Pégalo en Vercel como \`VITE_DISCORD_INVITE\` para el botón "Únete a la comunidad" de la app.`)
}

/** Botón "Acepto las reglas": da 👤 Miembro y abre los canales. */
async function aceptarReglas(interaction) {
  const cfg = await configServidor(interaction.guildId)
  if (!cfg?.miembro_role_id) return interaction.reply({ content: 'El servidor aún no está configurado. Avísale al equipo.', ...efimero })
  if (!interaction.member.roles.cache.has(cfg.miembro_role_id)) {
    await interaction.member.roles.add(cfg.miembro_role_id, 'Kaibu: aceptó las reglas')
  }
  // Para el ranking de invitaciones: recién ahora cuenta quien lo invitó.
  await require('./invitaciones').marcarVerificado(interaction.guildId, interaction.user.id).catch((e) => console.error('No pude marcar la invitación:', e.message))
  const info = cfg.welcome_channel_id ? `<#${cfg.welcome_channel_id}>` : '#información'
  const presentate = cfg.presentate_channel_id ? `<#${cfg.presentate_channel_id}>` : '#preséntate'
  return interaction.reply({
    content: `🎉 ¡Listo, ya eres parte de la comunidad! Elige tu región en ${info} y preséntate en ${presentate}. Si quieres probar Kaibu antes que nadie, postula a beta tester en ${info}.`,
    ...efimero,
  })
}

const ROLES_OPCIONALES = {
  rol_novedades: { clave: 'updates_role_id', que: 'cada versión grande de Kaibu' },
  rol_tiktok: { clave: 'tiktok_role_id', que: 'cada video nuevo en TikTok e Instagram' },
  rol_lanzamiento: { clave: 'lanzamiento_role_id', que: 'el día del lanzamiento de Kaibu' },
}

/** Botones de #información: pone o quita un rol de aviso opcional. */
async function alternarRol(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const def = ROLES_OPCIONALES[interaction.customId]
  const rolId = def && cfg?.[def.clave]
  if (!rolId) return interaction.reply({ content: 'Falta configurar el servidor (/setup).', ...efimero })
  const miembro = interaction.member
  if (miembro.roles.cache.has(rolId)) {
    await miembro.roles.remove(rolId)
    return interaction.reply({ content: `Listo, te quité <@&${rolId}>: ya no te avisaremos de ${def.que}.`, ...efimero })
  }
  await miembro.roles.add(rolId)
  return interaction.reply({ content: `¡Listo! Con <@&${rolId}> te avisaremos de ${def.que}.`, ...efimero })
}

module.exports = {
  setup,
  autoSetup,
  configurarServidor,
  invitacion,
  aceptarReglas,
  alternarRol,
  ROLES,
  ROLES_EXTRA,
  refrescarBienvenida,
  refrescarRoadmap,
  ESTRUCTURA,
}
