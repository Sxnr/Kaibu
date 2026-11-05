// /setup e /invitacion: crea o repara la comunidad sin duplicar canales, roles ni paneles.
// Al entrar solo se ve #verificación; al aceptar las reglas se recibe 👤 Miembro.
const {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js')
const { supabase, configServidor, APP_URL, VERSION_APP, COLOR } = require('./config')
const { embedKaibu, conBanner } = require('./marca')
const { permisosCanal } = require('./permisos')
const { traerMiembros } = require('./miembros')

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
]

// tipo = quién ve y quién escribe (ver lib/permisos.js).
const ESTRUCTURA = [
  {
    nombre: '✅ VERIFICACIÓN',
    tipo: 'verificacion',
    canales: [{ clave: 'verificacion_channel_id', nombre: '✅・verificación', tipo: 'verificacion' }],
  },
  {
    nombre: '📌 INFORMACIÓN KAIBU',
    tipo: 'info',
    canales: [
      { clave: 'welcome_channel_id', nombre: '👋・bienvenida-y-reglas', tipo: 'info' },
      { clave: 'updates_channel_id', nombre: '🚀・novedades-app', tipo: 'info' },
      { clave: 'roadmap_channel_id', nombre: '🗺️・roadmap-sprints', tipo: 'info' },
    ],
  },
  {
    nombre: '🧪 BETA & FEEDBACK',
    tipo: 'beta',
    canales: [
      { clave: 'feedback_channel_id', nombre: '🛠️・centro-de-feedback', tipo: 'betaLectura' },
      { clave: 'suggestions_channel_id', nombre: '💡・sugerencias-comunidad', tipo: 'comunidadLectura' },
      { nombre: '💬・chat-beta-testers', tipo: 'beta' },
    ],
  },
  {
    nombre: '💪 COMUNIDAD & PROGRESO',
    tipo: 'comunidad',
    canales: [
      { clave: 'general_channel_id', nombre: '💬・general', tipo: 'comunidad' },
      { clave: 'progress_channel_id', nombre: '📈・tarjetas-de-progreso', tipo: 'comunidad' },
      { nombre: '🏋️・gym-y-cargas', tipo: 'comunidad' },
      { nombre: '🥑・mesa-chilena-y-recetas', tipo: 'comunidad' },
    ],
  },
  {
    nombre: '🔒 STAFF & TRIAJE',
    tipo: 'staff',
    canales: [
      { clave: 'bug_triage_channel_id', nombre: '🐛・triaje-bugs', tipo: 'staff' },
      { clave: 'postulaciones_channel_id', nombre: '🧪・postulaciones-beta', tipo: 'staff' },
      { clave: 'survey_logs_channel_id', nombre: '📊・resultados-on09', tipo: 'staff' },
    ],
  },
]

/** Convierte la lista de permisos (nombres) al formato de discord.js. */
const aOverwrites = (lista) => lista.map((o) => ({ id: o.id, allow: o.allow.map((n) => P[n]), deny: o.deny.map((n) => P[n]) }))

async function buscarOCrearRol(guild, cfg, def, cuenta) {
  const existente = (cfg?.[def.clave] && guild.roles.cache.get(cfg[def.clave])) || guild.roles.cache.find((r) => r.name === def.nombre)
  if (existente) return existente
  cuenta.creados += 1
  return guild.roles.create({ name: def.nombre, colors: { primaryColor: def.color }, hoist: Boolean(def.hoist), reason: 'Kaibu /setup' })
}

/** Busca el canal (por ID guardado o por nombre) o lo crea; en ambos casos deja los permisos al día. */
async function asegurarCanal(guild, { id, nombre, tipo, padre, permisos }, cuenta) {
  const existente =
    (id && guild.channels.cache.get(id)) ||
    guild.channels.cache.find((c) => c.name === nombre && c.type === tipo && (tipo === ChannelType.GuildCategory || c.parentId === (padre?.id ?? null)))
  if (existente) {
    await existente.permissionOverwrites.set(permisos, 'Kaibu /setup: permisos por rol')
    return existente
  }
  cuenta.creados += 1
  return guild.channels.create({ name: nombre, type: tipo, parent: padre?.id, permissionOverwrites: permisos, reason: 'Kaibu /setup' })
}

/** Publica el panel si el canal no tiene uno del bot; si ya existe, lo actualiza. */
async function asegurarPanel(canal, botId, contenido) {
  const mensajes = await canal.messages.fetch({ limit: 30 })
  const delBot = [...mensajes.values()].filter((m) => m.author.id === botId).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  if (delBot.length > 0) return delBot[0].edit(contenido)
  const { attachments: _sinUso, ...nuevo } = contenido
  return canal.send(nuevo)
}

function panelVerificacion() {
  const embed = embedKaibu(COLOR.marca)
    .setTitle('Bienvenido a la comunidad de Kaibu 🇨🇱')
    .setDescription('Antes de entrar, lee las reglas. Al aceptarlas se abren todos los canales de la comunidad.')
    .addFields(
      { name: '🩺 Orientación, no diagnóstico', value: 'Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.' },
      { name: '🙅 Sin fotos corporales', value: 'Comparte solo tus tarjetas de progreso (Progreso → Compartir mi semana).' },
      { name: '🤝 Respeto en cada fase', value: 'Bajar, mantener o subir: todos los ritmos son válidos. Cero burlas sobre cuerpos o comidas.' },
      { name: '🔒 Tus datos son tuyos (Ley 21.719)', value: 'No publiques datos de salud de otras personas.' },
      { name: '🚫 Sin spam ni ventas', value: 'Nada de publicidad, links sospechosos ni venta de suplementos.' },
    )
  const fila = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('aceptar_reglas').setLabel('✅ Acepto las reglas').setStyle(ButtonStyle.Success),
  )
  return conBanner('verificacion', embed, { components: [fila] })
}

function panelBienvenida(cfg) {
  const embed = embedKaibu(COLOR.marca)
    .setTitle('Te cobran por que tu plan se adapte. Kaibu lo adapta gratis.')
    .setDescription('Kaibu es la app chilena para anotar lo que comes y ver tu progreso por fases. Tu plan, su explicación y el ajuste semanal con tu promedio real de 7 días son gratis para siempre.')
    .addFields(
      { name: '📱 Úsala', value: `[Abrir Kaibu](${APP_URL}) en la web, instálala en tu celular o pide el APK de Android.`, inline: false },
      { name: '🧪 Beta testers (cupos limitados)', value: 'Postula con el botón de abajo: verás el chat de testers, el centro de feedback y podrás vincular tu cuenta para tener roles por racha.' },
      { name: '🔗 Vincular tu cuenta (beta testers)', value: 'En la app: Más → Comunidad → Generar código, y aquí escribe `/vincular`. Recibes 💪 Atleta Kaibu, 🔥 7+ y ⚡ 30+ días.' },
      { name: '💬 Dónde conversar', value: `${cfg.general_channel_id ? `<#${cfg.general_channel_id}>` : '#general'} para todo, ${cfg.progress_channel_id ? `<#${cfg.progress_channel_id}>` : '#tarjetas-de-progreso'} para tus semanas y ${cfg.suggestions_channel_id ? `<#${cfg.suggestions_channel_id}>` : '#sugerencias'} para votar ideas.` },
    )
  const fila = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('postular_beta').setLabel('🧪 Postular a beta tester').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('rol_novedades').setLabel('🔔 Avisarme de novedades').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setLabel('Abrir Kaibu').setStyle(ButtonStyle.Link).setURL(APP_URL),
  )
  return conBanner('bienvenida', embed, { components: [fila] })
}

function panelRoadmap() {
  const embed = embedKaibu(COLOR.exito)
    .setTitle('🗺️ Hoja de ruta de Kaibu')
    .setDescription('Lo que ya está y lo que viene, etapa por etapa. Las sugerencias más votadas se suman aquí.')
    .addFields(
      { name: `✅ Etapa 1 y MVP · versión actual ${VERSION_APP}`, value: 'Plan explicado, registro rápido con comidas chilenas y productos de marca, promedio de 7 días, ajuste semanal gratis, agua, nota del día, Tu semana, compartir progreso, tutorial, comunidad y tus datos (descargar o borrar).' },
      { name: '🚧 Etapa 2 · Progreso y hábitos (Sprints 3 y 4)', value: 'Suplementos, fotos privadas y medidas, recordatorios, gym con progresión de cargas, recetas, ayuno e informe PDF.' },
      { name: '📦 Etapa 3 · Escáner y comunidad (Sprints 5 y 6)', value: 'Escáner de códigos de barras, sellos ALTO EN, micronutrientes (fibra, azúcar y sodio) y alimentos aportados por la comunidad.' },
      { name: '🤖 Etapa 4 · IA y tiendas (Sprints 7 a 10)', value: 'Apps en Google Play y App Store, Salud, Kaibu+ (registro con IA y extras; precio en validación) y plan Profesional para gimnasios y nutris.' },
    )
  return conBanner('roadmap', embed)
}

function panelFeedback(cfg) {
  const embed = embedKaibu(COLOR.info)
    .setTitle('🛠️ Centro de feedback de la beta')
    .setDescription('Tu ayuda define el futuro de Kaibu. Todo llega directo al equipo.')
    .addFields(
      { name: '🐛 Reportar un bug', value: '¿Algo falló en la web, la app instalada o el APK? Cuéntanos qué pasó y cómo repetirlo.' },
      { name: '💡 Enviar sugerencia', value: `La comunidad la vota en ${cfg.suggestions_channel_id ? `<#${cfg.suggestions_channel_id}>` : '#sugerencias'}.` },
      { name: '📊 Encuesta Kaibu+', value: '1 minuto para decidir qué extras y a qué precio.' },
      { name: '📱 Desde la app', value: 'También puedes enviar reportes y sugerencias en Más → Comunidad, incluso sin conexión.' },
    )
  const botones = [
    new ButtonBuilder().setCustomId('abrir_bug').setLabel('🐛 Reportar bug').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('abrir_sugerencia').setLabel('💡 Enviar sugerencia').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('abrir_encuesta').setLabel('📊 Encuesta Kaibu+').setStyle(ButtonStyle.Success),
  ]
  if (process.env.FORM_URL) botones.push(new ButtonBuilder().setLabel('Encuesta completa (6 min)').setStyle(ButtonStyle.Link).setURL(process.env.FORM_URL))
  return conBanner('feedback', embed, { components: [new ActionRowBuilder().addComponents(botones)] })
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

async function setup(interaction) {
  await interaction.deferReply(efimero)
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

  const roles = { everyone: guild.id, bot: yo.id, miembro: ids.miembro_role_id, tester: ids.tester_role_id, equipo: ids.equipo_role_id }
  const canales = {}
  for (const cat of ESTRUCTURA) {
    const categoria = await asegurarCanal(guild, { nombre: cat.nombre, tipo: ChannelType.GuildCategory, permisos: aOverwrites(permisosCanal(cat.tipo, roles)) }, cuenta)
    for (const def of cat.canales) {
      const canal = await asegurarCanal(
        guild,
        { id: def.clave && cfg?.[def.clave], nombre: def.nombre, tipo: ChannelType.GuildText, padre: categoria, permisos: aOverwrites(permisosCanal(def.tipo, roles)) },
        cuenta,
      )
      if (def.clave) {
        ids[def.clave] = canal.id
        canales[def.clave] = canal
      }
    }
  }
  // La categoría de verificación va primero.
  const catVerif = canales.verificacion_channel_id?.parent
  if (catVerif && catVerif.position !== 0) await catVerif.setPosition(0).catch(() => null)

  const nuevaCfg = { ...cfg, ...ids }
  await asegurarPanel(canales.verificacion_channel_id, yo.id, panelVerificacion())
  await asegurarPanel(canales.welcome_channel_id, yo.id, panelBienvenida(nuevaCfg))
  await asegurarPanel(canales.roadmap_channel_id, yo.id, panelRoadmap())
  await asegurarPanel(canales.feedback_channel_id, yo.id, panelFeedback(nuevaCfg))
  ids.invite_url = await asegurarInvitacion(guild, cfg, canales.verificacion_channel_id)

  const { error } = await supabase().from('discord_guild_config').upsert(ids, { onConflict: 'guild_id' })
  if (error) throw error
  const migrados = await darMiembroATodos(guild, ids.miembro_role_id).catch((e) => {
    console.error('No pude dar 👤 Miembro a los que ya estaban:', e.message)
    return -1
  })

  return interaction.editReply(
    `✅ **Comunidad lista** (${cuenta.creados === 0 ? 'no faltaba nada; se actualizaron permisos y paneles' : `se crearon ${cuenta.creados} canales o roles que faltaban`}).\n` +
      `• Quien entre ahora solo ve <#${ids.verificacion_channel_id}> hasta aceptar las reglas.\n` +
      (migrados > 0 ? `• ${migrados} personas que ya estaban recibieron 👤 Miembro.\n` : '') +
      (migrados < 0 ? '• ⚠️ Discord pidió esperar: vuelve a ejecutar /setup en un minuto para dar 👤 Miembro a quienes ya estaban.\n' : '') +
      `• Dale el rol <@&${ids.equipo_role_id}> a quien te ayude a revisar postulaciones (cupo actual: ${cfg?.cupo_beta ?? 20}).\n\n` +
      `**Link de invitación para la app:** ${ids.invite_url}\nPégalo en Vercel como \`VITE_DISCORD_INVITE\`.`,
  )
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
  const bienvenida = cfg.welcome_channel_id ? `<#${cfg.welcome_channel_id}>` : '#bienvenida'
  return interaction.reply({ content: `🎉 ¡Listo, ya eres parte de la comunidad! Empieza por ${bienvenida} y, si quieres probar Kaibu antes que nadie, postula a beta tester ahí mismo.`, ...efimero })
}

/** Botón de la bienvenida: pone o quita 🔔 Novedades. */
async function alternarNovedades(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const rolId = cfg?.updates_role_id
  if (!rolId) return interaction.reply({ content: 'Falta configurar el servidor (/setup).', ...efimero })
  const miembro = interaction.member
  if (miembro.roles.cache.has(rolId)) {
    await miembro.roles.remove(rolId)
    return interaction.reply({ content: `Listo, te quité el rol <@&${rolId}>.`, ...efimero })
  }
  await miembro.roles.add(rolId)
  return interaction.reply({ content: `¡Listo! Te avisaremos de cada novedad con <@&${rolId}>.`, ...efimero })
}

module.exports = { setup, invitacion, aceptarReglas, alternarNovedades, ROLES, panelVerificacion, panelBienvenida, panelRoadmap, panelFeedback }
