// /setup e /invitacion: crea o repara la comunidad sin duplicar canales, roles ni paneles.
const {
  ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js')
const { supabase, configServidor, APP_URL, VERSION_APP, COLOR } = require('./config')

// Los nombres son los mismos del primer /setup: así se reconocen los que ya existen.
const ROLES = [
  { clave: 'tester_role_id', nombre: '🧪 Beta Tester', color: '#5AB0E6', hoist: true },
  { clave: 'updates_role_id', nombre: '🔔 Ping Novedades', color: '#3FBF7F' },
  { clave: 'racha7_role_id', nombre: '🔥 Racha 7+ Días', color: '#F97316' },
  { clave: 'racha30_role_id', nombre: '⚡ Racha 30+ Días', color: '#E8B04B' },
  { clave: 'atleta_role_id', nombre: '💪 Atleta Kaibu', color: '#B3202A' },
]

const P = PermissionFlagsBits
const PERMISOS_BOT = [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ReadMessageHistory, P.CreatePublicThreads, P.SendMessagesInThreads, P.ManageMessages]

/** Canal de solo lectura: nadie escribe, pero sí se puede conversar en los hilos. */
const soloLectura = (guild, botId) => [
  { id: guild.id, deny: [P.SendMessages, P.CreatePublicThreads], allow: [P.ViewChannel, P.SendMessagesInThreads, P.ReadMessageHistory] },
  { id: botId, allow: PERMISOS_BOT },
]
const privado = (guild, botId) => [
  { id: guild.id, deny: [P.ViewChannel] },
  { id: botId, allow: PERMISOS_BOT },
]

const ESTRUCTURA = [
  {
    nombre: '📌 INFORMACIÓN KAIBU',
    canales: [
      { clave: 'welcome_channel_id', nombre: '👋・bienvenida-y-reglas', permisos: soloLectura },
      { clave: 'updates_channel_id', nombre: '🚀・novedades-app', permisos: soloLectura },
      { clave: 'roadmap_channel_id', nombre: '🗺️・roadmap-sprints', permisos: soloLectura },
    ],
  },
  {
    nombre: '🧪 BETA & FEEDBACK',
    canales: [
      { clave: 'feedback_channel_id', nombre: '🛠️・centro-de-feedback', permisos: soloLectura },
      { clave: 'suggestions_channel_id', nombre: '💡・sugerencias-comunidad', permisos: soloLectura },
      { nombre: '💬・chat-beta-testers' },
    ],
  },
  {
    nombre: '💪 COMUNIDAD & PROGRESO',
    canales: [
      { clave: 'general_channel_id', nombre: '💬・general' },
      { clave: 'progress_channel_id', nombre: '📈・tarjetas-de-progreso' },
      { nombre: '🏋️・gym-y-cargas' },
      { nombre: '🥑・mesa-chilena-y-recetas' },
    ],
  },
  {
    nombre: '🔒 STAFF & TRIAJE',
    permisos: privado,
    canales: [
      { clave: 'bug_triage_channel_id', nombre: '🐛・triaje-bugs' },
      { clave: 'survey_logs_channel_id', nombre: '📊・resultados-on09' },
    ],
  },
]

async function buscarOCrearRol(guild, cfg, def, cuenta) {
  const existente = (cfg?.[def.clave] && guild.roles.cache.get(cfg[def.clave])) || guild.roles.cache.find((r) => r.name === def.nombre)
  if (existente) return existente
  cuenta.creados += 1
  return guild.roles.create({ name: def.nombre, colors: { primaryColor: def.color }, hoist: Boolean(def.hoist), reason: 'Kaibu /setup' })
}

async function buscarOCrearCanal(guild, { id, nombre, tipo, padre, permisos }, cuenta) {
  const existente =
    (id && guild.channels.cache.get(id)) ||
    guild.channels.cache.find((c) => c.name === nombre && c.type === tipo && (tipo === ChannelType.GuildCategory || c.parentId === (padre?.id ?? null)))
  if (existente) return existente
  cuenta.creados += 1
  return guild.channels.create({ name: nombre, type: tipo, parent: padre?.id, permissionOverwrites: permisos, reason: 'Kaibu /setup' })
}

/** Publica el panel si el canal no tiene uno del bot; si ya existe, lo actualiza con el texto nuevo. */
async function asegurarPanel(canal, botId, contenido) {
  const mensajes = await canal.messages.fetch({ limit: 30 })
  const delBot = [...mensajes.values()].filter((m) => m.author.id === botId).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  if (delBot.length > 0) return delBot[0].edit(contenido)
  return canal.send(contenido)
}

function panelBienvenida() {
  const embed = new EmbedBuilder()
    .setTitle('Bienvenido a la comunidad de Kaibu 🇨🇱')
    .setDescription(
      '**Te cobran por que tu plan se adapte a ti. Kaibu lo adapta gratis.**\n\n' +
        'Kaibu es la app chilena para anotar lo que comes y ver tu progreso por fases. Tu plan, su explicación y el ajuste semanal con tu promedio real de 7 días son gratis para siempre.\n\n' +
        '**Reglas de la comunidad**\n' +
        '• **Orientación, no diagnóstico:** Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.\n' +
        '• **Sin fotos corporales:** comparte solo tus tarjetas de progreso (Progreso → Compartir mi semana).\n' +
        '• **Respeto en cada fase:** bajar, mantener o subir, todos los ritmos son válidos.\n' +
        '• **Tus datos son tuyos (Ley 21.719):** no publiques datos de salud de otras personas.\n\n' +
        '**Vincula tu cuenta:** en Kaibu → Más → Comunidad genera un código y escribe `/vincular` aquí. Recibes el rol 💪 Atleta Kaibu y los roles de racha 🔥 7+ y ⚡ 30+ días.',
    )
    .setColor(COLOR.marca)
  const fila = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rol_novedades').setLabel('🔔 Avisarme de novedades').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rol_tester').setLabel('🧪 Soy Beta Tester').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setLabel('Abrir Kaibu').setStyle(ButtonStyle.Link).setURL(APP_URL),
  )
  return { embeds: [embed], components: [fila] }
}

function panelRoadmap() {
  const embed = new EmbedBuilder()
    .setTitle('🗺️ Hoja de ruta de Kaibu')
    .addFields(
      { name: `✅ Etapa 1 y MVP · versión actual ${VERSION_APP}`, value: 'Plan explicado, registro rápido, catálogo chileno con productos de marca, promedio de 7 días, ajuste semanal gratis, agua, nota del día, Tu semana, compartir progreso, tutorial, y descargar o borrar tus datos.' },
      { name: '🚧 Etapa 2 · Progreso y hábitos (Sprints 3 y 4)', value: 'Suplementos, fotos privadas y medidas, recordatorios, gym con progresión de cargas (RN-20), recetas, ayuno e informe PDF.' },
      { name: '📦 Etapa 3 · Escáner y comunidad (Sprints 5 y 6)', value: 'Escáner de códigos de barras, sellos ALTO EN, micronutrientes (fibra, azúcar y sodio) y alimentos aportados por la comunidad.' },
      { name: '🤖 Etapa 4 · IA y tiendas (Sprints 7 a 10)', value: 'Apps en Google Play y App Store, Salud, Kaibu+ (registro con IA y extras; precio en validación) y plan Profesional para gimnasios y nutris.' },
    )
    .setColor(COLOR.exito)
  return { embeds: [embed] }
}

function panelFeedback(canalSugerencias) {
  const embed = new EmbedBuilder()
    .setTitle('🛠️ Centro de feedback de la beta')
    .setDescription(
      'Tu ayuda define el futuro de Kaibu:\n\n' +
        '🐛 **Reportar un bug:** ¿algo falló en la web, la app instalada o el APK? Cuéntanos y lo arreglamos en el sprint.\n' +
        `💡 **Enviar sugerencia:** la comunidad la vota en <#${canalSugerencias}>.\n` +
        '📊 **Encuesta Kaibu+:** 1 minuto para decidir qué extras y a qué precio.\n\n' +
        'También puedes enviar reportes y sugerencias desde la app: Más → Comunidad.',
    )
    .setColor(COLOR.info)
  const botones = [
    new ButtonBuilder().setCustomId('abrir_bug').setLabel('🐛 Reportar bug').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('abrir_sugerencia').setLabel('💡 Enviar sugerencia').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('abrir_encuesta').setLabel('📊 Encuesta Kaibu+').setStyle(ButtonStyle.Success),
  ]
  if (process.env.FORM_URL) {
    botones.push(new ButtonBuilder().setLabel('Encuesta completa (6 min)').setStyle(ButtonStyle.Link).setURL(process.env.FORM_URL))
  }
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(botones)] }
}

/** Link permanente de invitación (lo usa la app en "Únete a la comunidad"). */
async function asegurarInvitacion(guild, cfg, canalBienvenida) {
  if (cfg?.invite_url) {
    const codigo = cfg.invite_url.split('/').pop()
    const vigente = await guild.invites.fetch({ code: codigo, cache: false }).catch(() => null)
    if (vigente) return cfg.invite_url
  }
  const inv = await canalBienvenida.createInvite({ maxAge: 0, maxUses: 0, unique: false, reason: 'Link de la app Kaibu' })
  return inv.url
}

async function setup(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const guild = interaction.guild
  const yo = guild.members.me
  const faltan = [['Gestionar roles', P.ManageRoles], ['Gestionar canales', P.ManageChannels], ['Crear invitación', P.CreateInstantInvite]]
    .filter(([, p]) => !yo.permissions.has(p))
    .map(([n]) => n)
  if (faltan.length > 0) {
    return interaction.editReply(`⚠️ Al bot le faltan permisos: **${faltan.join(', ')}**. Dáselos en Ajustes del servidor → Roles y vuelve a ejecutar /setup.`)
  }

  await Promise.all([guild.roles.fetch(), guild.channels.fetch()])
  const cfg = await configServidor(guild.id)
  const cuenta = { creados: 0 }
  const ids = { guild_id: guild.id }

  for (const def of ROLES) ids[def.clave] = (await buscarOCrearRol(guild, cfg, def, cuenta)).id

  const canales = {}
  for (const cat of ESTRUCTURA) {
    const categoria = await buscarOCrearCanal(
      guild,
      { nombre: cat.nombre, tipo: ChannelType.GuildCategory, permisos: cat.permisos?.(guild, yo.id) },
      cuenta,
    )
    for (const def of cat.canales) {
      const canal = await buscarOCrearCanal(
        guild,
        { id: def.clave && cfg?.[def.clave], nombre: def.nombre, tipo: ChannelType.GuildText, padre: categoria, permisos: def.permisos?.(guild, yo.id) },
        cuenta,
      )
      if (def.clave) {
        ids[def.clave] = canal.id
        canales[def.clave] = canal
      }
    }
  }

  await asegurarPanel(canales.welcome_channel_id, yo.id, panelBienvenida())
  await asegurarPanel(canales.roadmap_channel_id, yo.id, panelRoadmap())
  await asegurarPanel(canales.feedback_channel_id, yo.id, panelFeedback(ids.suggestions_channel_id))
  ids.invite_url = await asegurarInvitacion(guild, cfg, canales.welcome_channel_id)

  const { error } = await supabase().from('discord_guild_config').upsert(ids, { onConflict: 'guild_id' })
  if (error) throw error

  return interaction.editReply(
    `✅ **Comunidad lista** (${cuenta.creados === 0 ? 'no faltaba nada, se actualizaron los paneles' : `se crearon ${cuenta.creados} canales o roles que faltaban`}).\n\n` +
      `**Link de invitación para la app:** ${ids.invite_url}\nPégalo en Vercel como \`VITE_DISCORD_INVITE\` (guía en ayuda/).\n\n` +
      `**Novedades automáticas:** en <#${ids.updates_channel_id}> → Integraciones → Webhooks, crea uno y pégalo en GitHub (Settings → Webhooks) agregando \`/github\` al final.`,
  )
}

async function invitacion(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const cfg = await configServidor(interaction.guildId)
  if (!cfg?.welcome_channel_id) return interaction.editReply('Primero ejecuta /setup.')
  const canal = await interaction.guild.channels.fetch(cfg.welcome_channel_id).catch(() => null)
  if (!canal) return interaction.editReply('No encuentro #bienvenida-y-reglas. Ejecuta /setup para repararlo.')
  const url = await asegurarInvitacion(interaction.guild, cfg, canal)
  if (url !== cfg.invite_url) await supabase().from('discord_guild_config').update({ invite_url: url }).eq('guild_id', interaction.guildId)
  return interaction.editReply(`🔗 ${url}\nEs permanente. Pégalo en Vercel como \`VITE_DISCORD_INVITE\` para el botón "Únete a la comunidad" de la app.`)
}

/** Botones de la bienvenida: ponen o quitan un rol. */
async function alternarRol(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const rolId = interaction.customId === 'rol_novedades' ? cfg?.updates_role_id : cfg?.tester_role_id
  if (!rolId) return interaction.reply({ content: 'Falta configurar el servidor (/setup).', flags: MessageFlags.Ephemeral })
  const miembro = interaction.member
  if (miembro.roles.cache.has(rolId)) {
    await miembro.roles.remove(rolId)
    return interaction.reply({ content: `Listo, te quité el rol <@&${rolId}>.`, flags: MessageFlags.Ephemeral })
  }
  await miembro.roles.add(rolId)
  return interaction.reply({ content: `¡Listo! Ahora tienes el rol <@&${rolId}>.`, flags: MessageFlags.Ephemeral })
}

module.exports = { setup, invitacion, alternarRol, ROLES }
