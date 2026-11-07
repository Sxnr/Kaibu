// Banner de bienvenida (opción A aprobada): foto de la persona al centro, su nombre, número de miembro
// y a los lados los primeros pasos. Se dibuja en el mismo bot con @napi-rs/canvas (gratis).
const path = require('node:path')
const { createCanvas, GlobalFonts, loadImage, Path2D } = require('@napi-rs/canvas')
const { nombreBanner, inicial } = require('./reglas')

const ANCHO = 1100
const ALTO = 480
const ASSETS = path.join(__dirname, '..', 'assets')
const C = { noche: '#0F0D0D', tinta: '#F4F1F0', suave: '#A39A98', borde: '#2E2828', ambar: '#E8B04B', marca: '#B3202A', intensa: '#D1343C' }

let fuentes = false
function cargarFuentes() {
  if (fuentes) return
  GlobalFonts.registerFromPath(path.join(ASSETS, 'fuentes', 'barlow-condensed-latin-800-normal.woff2'), 'Barlow')
  GlobalFonts.registerFromPath(path.join(ASSETS, 'fuentes', 'inter-latin-wght-normal.woff2'), 'Inter')
  fuentes = true
}

// Íconos (trazos de Lucide, 24×24).
const ICONOS = {
  check: ['M20 6 9 17l-5-5'],
  info: ['M12 16v-4', 'M12 8h.01', 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0'],
  matraz: ['M10 2v7.31L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.31V2', 'M8.5 2h7', 'M7 16h10'],
  chat: ['M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z', 'M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1'],
}

function icono(ctx, nombre, x, y, tam, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(tam / 24, tam / 24)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const d of ICONOS[nombre]) ctx.stroke(new Path2D(d))
  ctx.restore()
}

function fondo(ctx) {
  ctx.fillStyle = C.noche
  ctx.fillRect(0, 0, ANCHO, ALTO)
  const brillo = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(15,13,13,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, ANCHO, ALTO)
  }
  brillo(550, 145, 420, 'rgba(179,32,42,0.55)')
  brillo(0, 528, 380, 'rgba(232,176,75,0.16)')
  brillo(1100, 528, 380, 'rgba(90,176,230,0.14)')
  // Grano suave para que no se vea plano
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let y = 0; y < ALTO; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < ANCHO; x += 4) ctx.fillRect(x, y, 1, 1)
}

async function avatar(ctx, { url, nombre }) {
  const cx = 550
  const cy = 162
  const r = 84
  ctx.save()
  ctx.shadowColor = 'rgba(209,52,60,0.45)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 18
  const anillo = ctx.createConicGradient(3.5, cx, cy)
  anillo.addColorStop(0, C.intensa)
  anillo.addColorStop(0.5, C.ambar)
  anillo.addColorStop(1, C.intensa)
  ctx.fillStyle = anillo
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = C.noche
  ctx.beginPath()
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r - 11, 0, Math.PI * 2)
  ctx.clip()
  const imagen = url ? await loadImage(url).catch(() => null) : null
  if (imagen) {
    ctx.drawImage(imagen, cx - (r - 11), cy - (r - 11), (r - 11) * 2, (r - 11) * 2)
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    g.addColorStop(0, '#5AB0E6')
    g.addColorStop(1, '#3a6fa0')
    ctx.fillStyle = g
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = '#fff'
    ctx.font = '800 76px Barlow'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(inicial(nombre), cx, cy + 4)
  }
  ctx.restore()
}

function tarjeta(ctx, { x, y, color, icono: ic, titulo, linea1, linea2 }) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  ctx.fillStyle = 'rgba(27,23,23,0.9)'
  ctx.beginPath()
  ctx.roundRect(x, y, 250, 86, 18)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = C.borde
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, 249, 85, 18)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x + 16, y + 16, 38, 38, 12)
  ctx.fill()
  icono(ctx, ic, x + 24, y + 24, 22, '#fff')
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.tinta
  ctx.font = 'bold 16px Inter'
  ctx.fillText(titulo, x + 66, y + 32)
  ctx.fillStyle = C.suave
  ctx.font = '13.5px Inter'
  ctx.fillText(linea1, x + 66, y + 52)
  ctx.fillText(linea2, x + 66, y + 70)
}

/** Texto centrado que se achica hasta caber en el ancho. */
function centrado(ctx, texto, y, { tam, peso, familia, color, ancho, espaciado = 0 }) {
  let t = tam
  ctx.font = `${peso} ${t}px ${familia}`
  if (espaciado) ctx.letterSpacing = `${espaciado}px`
  while (ctx.measureText(texto).width > ancho && t > 20) {
    t -= 2
    ctx.font = `${peso} ${t}px ${familia}`
  }
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(texto, ANCHO / 2, y)
  ctx.letterSpacing = '0px'
}

/**
 * Dibuja el banner. `avatar` es la URL (o buffer) de la foto de perfil, o null para usar la inicial.
 * @returns {Promise<Buffer>} PNG de 1100×480
 */
async function dibujarBienvenida({ nombre, avatar: url, numero }) {
  cargarFuentes()
  const canvas = createCanvas(ANCHO, ALTO)
  const ctx = canvas.getContext('2d')
  fondo(ctx)
  const logo = await loadImage(path.join(ASSETS, 'logotipo-claro.svg')).catch(() => null)
  if (logo) {
    const alto = 30
    const ancho = (logo.width / logo.height) * alto
    ctx.drawImage(logo, (ANCHO - ancho) / 2, 26, ancho, alto)
  }
  await avatar(ctx, { url, nombre })
  centrado(ctx, 'TE DAMOS LA BIENVENIDA', 290, { tam: 18, peso: 'bold', familia: 'Inter', color: C.ambar, ancho: 520, espaciado: 4 })
  centrado(ctx, nombreBanner(nombre).toLocaleUpperCase('es-CL'), 352, { tam: 64, peso: '800', familia: 'Barlow', color: C.tinta, ancho: 540 })
  centrado(ctx, `Eres la persona #${numero} en el Discord de Kaibu`, 392, { tam: 19, peso: 'normal', familia: 'Inter', color: C.suave, ancho: 560 })
  tarjeta(ctx, { x: 46, y: 150, color: '#1f8155', icono: 'check', titulo: '1 · Verifícate', linea1: 'Acepta las reglas en', linea2: '#verificación' })
  tarjeta(ctx, { x: 46, y: 248, color: '#3a3434', icono: 'info', titulo: '2 · Infórmate', linea1: 'Qué es Kaibu en', linea2: '#información' })
  tarjeta(ctx, { x: 804, y: 150, color: C.marca, icono: 'matraz', titulo: 'Postula a la beta', linea1: 'Cupos limitados en', linea2: '#información' })
  tarjeta(ctx, { x: 804, y: 248, color: '#a8710f', icono: 'chat', titulo: 'Preséntate', linea1: 'Cuéntanos tu meta en', linea2: '#preséntate' })
  centrado(ctx, 'Nutrición y progreso, por fases · Hecho en Chile', 456, { tam: 15, peso: 'normal', familia: 'Inter', color: C.suave, ancho: 600 })
  return canvas.toBuffer('image/png')
}

module.exports = { dibujarBienvenida, ANCHO, ALTO }
