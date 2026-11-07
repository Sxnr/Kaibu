// /anuncio (solo el equipo): publica un aviso con el formato de Kaibu en #anuncios,
// con mención opcional a quien pidió ese tipo de aviso e imagen opcional.
const { MessageFlags, PermissionFlagsBits } = require('discord.js')
const { configServidor, COLOR } = require('./config')
const { esDelEquipo } = require('./permisos')
const { mensajeV2 } = require('./v2')

const efimero = { flags: MessageFlags.Ephemeral }
const MENCIONES = { novedades: 'updates_role_id', videos: 'tiktok_role_id', lanzamiento: 'lanzamiento_role_id' }

/** Mensaje del anuncio (lógica pura). Los saltos "\n" escritos en el comando se respetan. */
function mensajeAnuncio({ titulo, texto, rolId, imagenUrl }) {
  return mensajeV2({
    acento: COLOR.marca,
    menciones: { roles: rolId ? [rolId] : [] },
    piezas: [
      { texto: `# 📣 ${titulo}${rolId ? `\n<@&${rolId}>` : ''}` },
      { separador: true },
      { texto: String(texto).replace(/\\n/g, '\n') },
      imagenUrl ? { imagen: imagenUrl } : null,
      { separador: true },
      { texto: '-# Equipo Kaibu' },
    ],
  })
}

async function anuncio(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const roles = interaction.member?.roles?.cache ?? new Map()
  if (!esDelEquipo(roles, cfg, interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))) {
    return interaction.reply({ content: 'Solo el 🛡️ Equipo Kaibu puede publicar anuncios.', ...efimero })
  }
  const canal = cfg?.anuncios_channel_id && (await interaction.guild.channels.fetch(cfg.anuncios_channel_id).catch(() => null))
  if (!canal) return interaction.reply({ content: 'No encuentro #anuncios. Ejecuta /setup.', ...efimero })
  const mencion = interaction.options.getString('mencion') ?? 'nadie'
  const imagen = interaction.options.getAttachment('imagen')
  if (imagen && !String(imagen.contentType ?? '').startsWith('image/')) {
    return interaction.reply({ content: 'La imagen tiene que ser una foto (PNG, JPG o GIF).', ...efimero })
  }
  await interaction.deferReply(efimero)
  const enviado = await canal.send(
    mensajeAnuncio({
      titulo: interaction.options.getString('titulo', true),
      texto: interaction.options.getString('texto', true),
      rolId: MENCIONES[mencion] ? cfg[MENCIONES[mencion]] : null,
      imagenUrl: imagen?.url ?? null,
    }),
  )
  return interaction.editReply(`✅ Anuncio publicado: ${enviado.url}`)
}

module.exports = { mensajeAnuncio, anuncio, MENCIONES }
