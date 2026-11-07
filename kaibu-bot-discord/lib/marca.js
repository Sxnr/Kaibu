// Estética de Kaibu en los embeds: logo, pie con la versión, colores de la marca y banners (assets/banners/*.png).
const fs = require('node:fs')
const path = require('node:path')
const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const { APP_URL, VERSION_APP } = require('./config')

const LOGO = `${APP_URL}/icons/icon-192.png`
const CARPETA_BANNERS = path.join(__dirname, '..', 'assets', 'banners')

/** Embed con el logo de Kaibu arriba y la versión abajo. */
function embedKaibu(color) {
  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: 'Kaibu', iconURL: LOGO, url: APP_URL })
    .setFooter({ text: `Kaibu ${VERSION_APP} · Nutrición y progreso, por fases`, iconURL: LOGO })
}

/**
 * Agrega el banner del panel si existe (assets/banners/<nombre>.png) y arma el mensaje.
 * Sin banner, el mensaje sale igual, solo sin imagen.
 */
function conBanner(nombre, embed, extra = {}) {
  const archivo = path.join(CARPETA_BANNERS, `${nombre}.png`)
  if (!fs.existsSync(archivo)) return { embeds: [embed], files: [], attachments: [], ...extra }
  embed.setImage(`attachment://${nombre}.png`)
  return { embeds: [embed], files: [new AttachmentBuilder(archivo, { name: `${nombre}.png` })], attachments: [], ...extra }
}

module.exports = { embedKaibu, conBanner, LOGO }
