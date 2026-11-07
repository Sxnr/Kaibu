// Mensajes con el formato nuevo de Discord (Components V2): un bloque con banner, títulos, separadores
// y botones dentro de cada sección. Se ven como una página ordenada, no como una lista de campos.
const fs = require('node:fs')
const path = require('node:path')
const { AttachmentBuilder, ContainerBuilder, MessageFlags, SeparatorSpacingSize } = require('discord.js')

const CARPETA_BANNERS = path.join(__dirname, '..', 'assets', 'banners')
const color = (hex) => Number.parseInt(String(hex).replace('#', ''), 16)

// Límites de Discord para un mensaje V2.
const MAX_COMPONENTES = 40
const MAX_CARACTERES = 4000

/**
 * Arma un mensaje V2 con un solo bloque (contenedor).
 * Cada pieza es una de:
 *  - { banner: 'roadmap' }                    imagen de assets/banners/roadmap.png (si existe)
 *  - { texto: '## Título\nlínea…' }           texto con markdown
 *  - { separador: true, grande?: boolean }    línea divisoria
 *  - { texto: '…', boton: ButtonBuilder }     sección con un botón a la derecha
 *  - { texto: '…', miniatura: url }           sección con una imagen chica a la derecha (foto de perfil)
 *  - { imagen: url }                          imagen grande (por ejemplo, la de un anuncio)
 *  - { botones: [ButtonBuilder, …] }          fila de hasta 5 botones
 *  - { menu: StringSelectMenuBuilder }        menú desplegable
 * @param {{ acento: string, piezas: object[], menciones?: object }} opciones
 */
function mensajeV2({ acento, piezas, menciones }) {
  const bloque = new ContainerBuilder().setAccentColor(color(acento))
  const files = []
  for (const p of piezas) {
    if (!p) continue
    if (p.banner) {
      const archivo = path.join(CARPETA_BANNERS, `${p.banner}.png`)
      if (!fs.existsSync(archivo)) continue
      files.push(new AttachmentBuilder(archivo, { name: `${p.banner}.png` }))
      bloque.addMediaGalleryComponents((g) => g.addItems((i) => i.setURL(`attachment://${p.banner}.png`)))
    } else if (p.separador) {
      bloque.addSeparatorComponents((s) => s.setDivider(true).setSpacing(p.grande ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small))
    } else if (p.miniatura) {
      bloque.addSectionComponents((s) => s.addTextDisplayComponents((t) => t.setContent(p.texto)).setThumbnailAccessory((m) => m.setURL(p.miniatura)))
    } else if (p.imagen) {
      bloque.addMediaGalleryComponents((g) => g.addItems((i) => i.setURL(p.imagen)))
    } else if (p.boton) {
      bloque.addSectionComponents((s) => s.addTextDisplayComponents((t) => t.setContent(p.texto)).setButtonAccessory(p.boton))
    } else if (p.botones) {
      bloque.addActionRowComponents((r) => r.addComponents(...p.botones))
    } else if (p.menu) {
      bloque.addActionRowComponents((r) => r.addComponents(p.menu))
    } else if (p.texto) {
      bloque.addTextDisplayComponents((t) => t.setContent(p.texto))
    }
  }
  return {
    components: [bloque],
    files,
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: menciones ?? { parse: [] },
  }
}

/** Cuenta componentes y caracteres de texto (para revisar los límites de Discord en las pruebas). */
function medirV2(mensaje) {
  let componentes = 0
  let caracteres = 0
  const recorrer = (nodo) => {
    if (!nodo || typeof nodo !== 'object') return
    if (Array.isArray(nodo)) return nodo.forEach(recorrer)
    if (typeof nodo.type === 'number') componentes += 1
    if (nodo.type === 10 && typeof nodo.content === 'string') caracteres += nodo.content.length
    recorrer(nodo.components)
    recorrer(nodo.accessory)
  }
  recorrer(mensaje.components.map((c) => (typeof c.toJSON === 'function' ? c.toJSON() : c)))
  return { componentes, caracteres, cabe: componentes <= MAX_COMPONENTES && caracteres <= MAX_CARACTERES }
}

/** Texto de todo el mensaje (para encontrar un panel por su título). */
function textoV2(componentes) {
  return JSON.stringify(componentes.map((c) => (typeof c.toJSON === 'function' ? c.toJSON() : c)))
}

module.exports = { mensajeV2, medirV2, textoV2, MAX_COMPONENTES, MAX_CARACTERES }
