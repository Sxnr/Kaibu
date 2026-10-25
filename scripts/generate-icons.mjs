// Genera los íconos de Kaibu (SVG y PNG) a partir de scripts/brand.mjs.
// Uso: npm run icons
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import opentype from 'opentype.js'
import { iconoApp, iconoApple, iconoMaskable, iconoNotificacion, iconoOscuro, logotipo } from './brand.mjs'

const require = createRequire(import.meta.url)
const SALIDA = new URL('../public/icons/', import.meta.url)
await mkdir(SALIDA, { recursive: true })

const guardar = (nombre, contenido) => writeFile(new URL(nombre, SALIDA), contenido)
const png = (svgTexto, tamano) => sharp(Buffer.from(svgTexto)).resize(tamano, tamano).png().toBuffer()

// SVG
await guardar('logo.svg', iconoApp())
await guardar('favicon.svg', iconoApp())
await guardar('logo-maskable.svg', iconoMaskable())
await guardar('logo-oscuro.svg', iconoOscuro())
await guardar('notificacion.svg', iconoNotificacion())

// PNG para el manifiesto PWA, iOS y Android
await guardar('icon-192.png', await png(iconoApp(), 192))
await guardar('icon-512.png', await png(iconoApp(), 512))
await guardar('icon-maskable-512.png', await png(iconoMaskable(), 512))
await guardar('icon-maskable-192.png', await png(iconoMaskable(), 192))
await guardar('apple-touch-icon.png', await png(iconoApple(), 180))
await guardar('notificacion-96.png', await png(iconoNotificacion(), 96))
await guardar('logo-oscuro-512.png', await png(iconoOscuro(), 512))

// Logotipo horizontal con "KAIBU" en Barlow Condensed 700 (convertido a trazos)
const fuente = opentype.loadSync(
  require.resolve('@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff'),
)
const tamanoFuente = 400
const ruta = fuente.getPath('KAIBU', 0, 0, tamanoFuente, { letterSpacing: 0.04 })
const caja = ruta.getBoundingBox()
// Centra verticalmente las mayúsculas en los 512 px del ícono.
const desplY = 256 - (caja.y1 + caja.y2) / 2
const rutaFinal = fuente.getPath('KAIBU', -caja.x1, desplY, tamanoFuente, { letterSpacing: 0.04 })
const d = rutaFinal.toPathData(2)
const ancho = caja.x2 - caja.x1
await guardar('logotipo.svg', logotipo(d, ancho, '#1A1414'))
await guardar('logotipo-claro.svg', logotipo(d, ancho, '#F4F1F0'))
const vistaPrevia = await sharp(Buffer.from(logotipo(d, ancho, '#F4F1F0')))
  .resize({ height: 160 })
  .flatten({ background: '#0F0D0D' })
  .png()
  .toBuffer()
await guardar('logotipo-vista-previa.png', vistaPrevia)

console.log('Íconos generados en public/icons/')
