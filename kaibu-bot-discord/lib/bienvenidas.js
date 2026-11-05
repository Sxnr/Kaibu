// Cuando alguien entra al servidor: banner con su foto y su nombre en #bienvenidas (lo ve antes de verificarse).
// Y /video: el equipo comparte cada video nuevo en #kaibu-en-redes, avisando a quien tenga 🎥 Ping TikTok.
const { AttachmentBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js')
const { configServidor } = require('./config')
const { esDelEquipo } = require('./permisos')
const { dibujarBienvenida } = require('./tarjetaBienvenida')
const { urlVideoValida } = require('./reglas')
const { truncar } = require('./texto')

const efimero = { flags: MessageFlags.Ephemeral }

/** Foto de perfil como PNG (o null si no se puede descargar: el banner usa la inicial). */
async function descargarAvatar(usuario) {
  try {
    const url = usuario.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true })
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null
  } catch {
    return null
  }
}

async function darBienvenida(miembro) {
  if (miembro.user.bot) return
  try {
    const cfg = await configServidor(miembro.guild.id)
    const canal = cfg?.bienvenidas_channel_id && (await miembro.guild.channels.fetch(cfg.bienvenidas_channel_id).catch(() => null))
    if (!canal) return
    const png = await dibujarBienvenida({
      nombre: miembro.displayName || miembro.user.username,
      avatar: await descargarAvatar(miembro.user),
      numero: miembro.guild.memberCount,
    })
    const verificacion = cfg.verificacion_channel_id ? `<#${cfg.verificacion_channel_id}>` : '#verificación'
    await canal.send({
      content: `👋 ¡Hola <@${miembro.id}>! Empieza aceptando las reglas en ${verificacion}.`,
      files: [new AttachmentBuilder(png, { name: 'bienvenida-kaibu.png', description: `Bienvenida a ${truncar(miembro.displayName, 60)}` })],
      allowedMentions: { users: [miembro.id] },
    })
  } catch (e) {
    console.error('Error dando la bienvenida:', e)
  }
}

/** /video url [titulo]: solo el equipo; publica en #kaibu-en-redes con @🎥 Ping TikTok. */
async function compartirVideo(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const roles = new Set(interaction.member?.roles?.cache?.keys?.() ?? [])
  if (!esDelEquipo(roles, cfg, interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))) {
    return interaction.reply({ content: 'Solo el 🛡️ Equipo Kaibu puede compartir videos.', ...efimero })
  }
  const url = interaction.options.getString('url').trim()
  if (!urlVideoValida(url)) return interaction.reply({ content: 'Ese link no parece de TikTok, Instagram o YouTube (debe empezar con https://).', ...efimero })
  const canal = cfg?.redes_channel_id && (await interaction.client.channels.fetch(cfg.redes_channel_id).catch(() => null))
  if (!canal) return interaction.reply({ content: 'Falta el canal #kaibu-en-redes: ejecuta /setup.', ...efimero })
  const titulo = truncar(interaction.options.getString('titulo'), 200)
  const rol = cfg.tiktok_role_id
  await canal.send({
    content: `${rol ? `<@&${rol}> ` : ''}🎥 **¡Video nuevo de Kaibu!**${titulo ? ` ${titulo}` : ''}\nVelo completo y comenta en la primera hora: así le llega a más gente 🙌\n${url}`,
    allowedMentions: { roles: rol ? [rol] : [] },
  })
  return interaction.reply({ content: `✅ Publicado en <#${canal.id}>.`, ...efimero })
}

module.exports = { darBienvenida, compartirVideo }
