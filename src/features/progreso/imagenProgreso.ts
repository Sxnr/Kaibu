// Dibuja la imagen para historias (1080 × 1920) con la tarjeta del progreso. Siempre en tema oscuro, con los tokens de la marca.
import type { TarjetaCompartir } from '@/domain/calc/compartir'
import type { DiaNutricion } from '@/domain/calc/resumenSemanal'
import { inicialDia } from '@/domain/format/formato'

export const ANCHO_IMAGEN = 1080
export const ALTO_IMAGEN = 1920
const MARGEN = 80
const FUENTE_TITULO = '"Barlow Condensed", "Arial Narrow", sans-serif'
const FUENTE_TEXTO = '"Inter Variable", Inter, system-ui, sans-serif'

interface Paleta {
  fondo: string
  superficie: string
  borde: string
  texto: string
  secundario: string
  marca: string
  marcaIntensa: string
  exito: string
}

/** Lee los colores del tema oscuro desde las variables CSS (tokens), para no repetir valores. */
function paletaOscura(): Paleta {
  const el = document.createElement('div')
  el.className = 'dark'
  el.hidden = true
  document.body.append(el)
  const css = getComputedStyle(el)
  const v = (nombre: string) => css.getPropertyValue(nombre).trim()
  const paleta = {
    fondo: v('--fondo'),
    superficie: v('--superficie'),
    borde: v('--borde'),
    texto: v('--texto'),
    secundario: v('--texto-secundario'),
    marca: v('--marca'),
    marcaIntensa: v('--marca-intensa'),
    exito: v('--exito'),
  }
  el.remove()
  return paleta
}

function cargarImagen(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function cargarFuentes(): Promise<void> {
  try {
    await Promise.all([document.fonts.load(`800 120px ${FUENTE_TITULO}`), document.fonts.load(`500 40px ${FUENTE_TEXTO}`)])
  } catch {
    // Si la fuente no carga, el canvas usa la de respaldo: la imagen igual sirve.
  }
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Ajusta el tamaño de letra para que el texto quepa en el ancho dado. */
function ajustarTexto(ctx: CanvasRenderingContext2D, texto: string, peso: string, tamano: number, familia: string, ancho: number) {
  let t = tamano
  ctx.font = `${peso} ${t}px ${familia}`
  while (ctx.measureText(texto).width > ancho && t > 20) {
    t -= 4
    ctx.font = `${peso} ${t}px ${familia}`
  }
}

function dibujarDatos(ctx: CanvasRenderingContext2D, p: Paleta, tarjeta: TarjetaCompartir, yInicio: number): number {
  const columnas = 2
  const espacio = 32
  const anchoCelda = (ANCHO_IMAGEN - MARGEN * 2 - espacio) / columnas
  const altoCelda = 270
  tarjeta.datos.forEach((d, i) => {
    const x = MARGEN + (i % columnas) * (anchoCelda + espacio)
    const y = yInicio + Math.floor(i / columnas) * (altoCelda + espacio)
    rectRedondeado(ctx, x, y, anchoCelda, altoCelda, 40)
    ctx.fillStyle = p.superficie
    ctx.fill()
    ctx.strokeStyle = p.borde
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = i === 0 ? p.marcaIntensa : p.texto
    ajustarTexto(ctx, d.valor, '800', 150, FUENTE_TITULO, anchoCelda - 80)
    ctx.textAlign = 'left'
    ctx.fillText(d.valor, x + 40, y + 170)
    ctx.fillStyle = p.secundario
    ajustarTexto(ctx, d.etiqueta, '500', 40, FUENTE_TEXTO, anchoCelda - 80)
    ctx.fillText(d.etiqueta, x + 40, y + 230)
  })
  const filas = Math.ceil(tarjeta.datos.length / columnas)
  return yInicio + filas * (altoCelda + espacio)
}

/** Barras de kcal por día: llenas si quedaron en el rango, huecas si no (no depende solo del color). */
function dibujarBarras(ctx: CanvasRenderingContext2D, p: Paleta, dias: DiaNutricion[], rango: { min: number; max: number }, hoy: string, yInicio: number, alto: number) {
  const pasados = dias.filter((d) => d.fecha <= hoy)
  if (pasados.length === 0) return
  const maxKcal = Math.max(rango.max * 1.15, ...dias.map((d) => d.kcal))
  const ancho = ANCHO_IMAGEN - MARGEN * 2
  const paso = ancho / dias.length
  const anchoBarra = Math.max(8, paso * 0.6)
  const y = (kcal: number) => yInicio + (1 - kcal / maxKcal) * alto
  ctx.fillStyle = p.exito
  ctx.globalAlpha = 0.16
  ctx.fillRect(MARGEN, y(rango.max), ancho, y(rango.min) - y(rango.max))
  ctx.globalAlpha = 1
  dias.forEach((d, i) => {
    if (d.registros === 0) return
    const x = MARGEN + paso * i + (paso - anchoBarra) / 2
    const enRango = d.kcal >= rango.min && d.kcal <= rango.max
    rectRedondeado(ctx, x, y(d.kcal), anchoBarra, y(0) - y(d.kcal), 12)
    if (enRango) {
      ctx.fillStyle = p.exito
      ctx.fill()
    } else {
      ctx.setLineDash([14, 10])
      ctx.strokeStyle = p.secundario
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.setLineDash([])
    }
  })
  ctx.fillStyle = p.borde
  ctx.fillRect(MARGEN, y(0), ancho, 3)
  // Iniciales de los días solo en la semana (en el mes no caben).
  if (dias.length <= 7) {
    ctx.textAlign = 'center'
    ctx.font = `500 36px ${FUENTE_TEXTO}`
    dias.forEach((d, i) => {
      ctx.fillStyle = d.fecha > hoy ? p.borde : p.secundario
      ctx.fillText(inicialDia(d.fecha), MARGEN + paso * i + paso / 2, y(0) + 56)
    })
  }
}

export interface DatosImagen {
  tarjeta: TarjetaCompartir
  dias: DiaNutricion[]
  rango: { min: number; max: number }
  hoy: string
}

/** Genera la imagen PNG de la tarjeta para compartir. */
export async function generarImagenProgreso({ tarjeta, dias, rango, hoy }: DatosImagen): Promise<Blob> {
  const [logo] = await Promise.all([cargarImagen('/icons/logotipo-claro.svg'), cargarFuentes()])
  const canvas = document.createElement('canvas')
  canvas.width = ANCHO_IMAGEN
  canvas.height = ALTO_IMAGEN
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la imagen en este navegador.')
  const p = paletaOscura()

  // Fondo con un brillo rojo de la marca arriba.
  ctx.fillStyle = p.fondo
  ctx.fillRect(0, 0, ANCHO_IMAGEN, ALTO_IMAGEN)
  const brillo = ctx.createRadialGradient(ANCHO_IMAGEN / 2, -200, 50, ANCHO_IMAGEN / 2, -200, 1300)
  brillo.addColorStop(0, p.marca)
  brillo.addColorStop(1, p.fondo)
  ctx.globalAlpha = 0.55
  ctx.fillStyle = brillo
  ctx.fillRect(0, 0, ANCHO_IMAGEN, ALTO_IMAGEN)
  ctx.globalAlpha = 1

  if (logo) ctx.drawImage(logo, MARGEN, 130, (110 * 1494) / 512, 110)

  ctx.textAlign = 'left'
  ctx.fillStyle = p.texto
  ajustarTexto(ctx, tarjeta.titulo.toUpperCase(), '800', 130, FUENTE_TITULO, ANCHO_IMAGEN - MARGEN * 2)
  ctx.fillText(tarjeta.titulo.toUpperCase(), MARGEN, 440)
  ctx.fillStyle = p.secundario
  ctx.font = `500 44px ${FUENTE_TEXTO}`
  ctx.fillText(tarjeta.subtitulo, MARGEN, 510)

  const yFinDatos = dibujarDatos(ctx, p, tarjeta, 600)
  const altoBarras = Math.min(360, ALTO_IMAGEN - 320 - yFinDatos - 60)
  if (altoBarras > 120) dibujarBarras(ctx, p, dias, rango, hoy, yFinDatos + 40, altoBarras)

  ctx.textAlign = 'center'
  ctx.fillStyle = p.secundario
  ctx.font = `500 40px ${FUENTE_TEXTO}`
  ctx.fillText('Nutrición y progreso, por fases', ANCHO_IMAGEN / 2, ALTO_IMAGEN - 150)
  ctx.fillStyle = p.texto
  ctx.font = `700 44px ${FUENTE_TEXTO}`
  ctx.fillText('kaibu-nine.vercel.app', ANCHO_IMAGEN / 2, ALTO_IMAGEN - 90)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen.'))), 'image/png'),
  )
}

/** Comparte la imagen con el menú del celular; si no se puede, la descarga. Devuelve cómo terminó. */
export async function compartirODescargar(blob: Blob, titulo: string): Promise<'compartida' | 'descargada' | 'cancelada'> {
  const archivo = new File([blob], 'kaibu-progreso.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo })
      return 'compartida'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelada'
      // Otro error: se ofrece la descarga como respaldo.
    }
  }
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'kaibu-progreso.png'
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'descargada'
}
