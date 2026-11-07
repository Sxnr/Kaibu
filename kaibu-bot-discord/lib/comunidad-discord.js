// Ajustes de "Comunidad" de Discord para Kaibu: canal de reglas, avisos de Discord, idioma, seguridad
// y pantalla de bienvenida. Lo aplica /setup (y el arranque del bot). Necesita "Gestionar servidor".
const {
  GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildSystemChannelFlags, GuildVerificationLevel, Locale, PermissionFlagsBits,
} = require('discord.js')

const DESCRIPCION =
  'Comunidad chilena de Kaibu, la app gratis para contar calorías y proteína con la comida que de verdad comemos. ' +
  'Gym, comida chilena, desafíos semanales y beta privada.'

/** Ajustes del servidor (lógica pura: recibe los IDs de los canales). */
function ajustesComunidad({ reglas, avisos, bienvenidas }) {
  return {
    rulesChannel: reglas,
    publicUpdatesChannel: avisos,
    systemChannel: bienvenidas,
    // El bot ya da la bienvenida con su banner: sin los mensajes automáticos de Discord.
    systemChannelFlags: [
      GuildSystemChannelFlags.SuppressJoinNotifications,
      GuildSystemChannelFlags.SuppressJoinNotificationReplies,
      GuildSystemChannelFlags.SuppressGuildReminderNotifications,
    ],
    preferredLocale: Locale.SpanishLATAM,
    description: DESCRIPCION,
    defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
    explicitContentFilter: GuildExplicitContentFilter.AllMembers,
    verificationLevel: GuildVerificationLevel.Medium,
  }
}

/** Pantalla de bienvenida: los canales que ve quien recién entra (todos visibles sin verificarse). */
function pantallaBienvenida({ verificacion, reglas, bienvenidas }) {
  return {
    enabled: true,
    description: 'Contar calorías y proteína a la chilena, en comunidad. Acepta las reglas para entrar.',
    welcomeChannels: [
      { channel: verificacion, description: 'Acepta las reglas y entra', emoji: '✅' },
      { channel: reglas, description: 'Cómo convivimos aquí', emoji: '📜' },
      { channel: bienvenidas, description: 'Saluda a quien llega', emoji: '👋' },
    ],
  }
}

/** Aplica los ajustes. Devuelve un resumen para /setup (nunca bota el setup si algo falla). */
async function configurarComunidad(guild, canales) {
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return '⚠️ Para dejar configurada la Comunidad de Discord, dale al bot el permiso **Gestionar servidor** y vuelve a ejecutar /setup.'
  }
  const resumen = []
  try {
    await guild.edit({ ...ajustesComunidad(canales), reason: 'Kaibu /setup: ajustes de comunidad' })
    resumen.push('reglas, idioma, seguridad y avisos de Discord')
  } catch (e) {
    console.error('No pude aplicar los ajustes de comunidad:', e.message)
    return `⚠️ No pude aplicar los ajustes de comunidad (${e.message}). ¿Está activado "Comunidad" en Ajustes del servidor?`
  }
  try {
    await guild.editWelcomeScreen(pantallaBienvenida(canales))
    resumen.push('pantalla de bienvenida')
  } catch (e) {
    console.error('No pude editar la pantalla de bienvenida:', e.message)
  }
  return `🏘️ Comunidad de Discord configurada: ${resumen.join(' y ')}.`
}

module.exports = { ajustesComunidad, pantallaBienvenida, configurarComunidad, DESCRIPCION }
