// Geometría del logo de Kaibu (lienzo de 512 × 512).
// La "K": un tronco vertical, un brazo diagonal que termina en punta de flecha
// hacia arriba a la derecha (progreso) y una pierna que baja.

export const COLORES = {
  marca: '#B3202A',
  fondoOscuro: '#0F0D0D',
  superficieOscura: '#1B1717',
  blanco: '#FFFFFF',
}

/** Formas de la K centradas en el lienzo de 512. */
export const K_FORMAS = [
  '<rect x="124" y="118" width="78" height="276"/>',
  '<polygon points="135.4,315.4 190.6,370.6 357.6,203.6 302.4,148.4"/>',
  '<polygon points="388,118 388,262 244,118"/>',
  '<polygon points="267.3,245 386.2,394 283.8,394 204.8,295"/>',
].join('')

/** K con color y escala (alrededor del centro del lienzo). */
export function k(color, escala = 1) {
  const t = escala === 1 ? '' : ` transform="translate(256 256) scale(${escala}) translate(-256 -256)"`
  return `<g fill="${color}"${t}>${K_FORMAS}</g>`
}

const svg = (contenido, w = 512, h = 512) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${contenido}</svg>\n`

/** Ícono de app: K blanca sobre cuadrado carmesí con esquinas redondeadas. */
export const iconoApp = () => svg(`<rect width="512" height="512" rx="112" fill="${COLORES.marca}"/>${k(COLORES.blanco, 0.92)}`)

/** Maskable (Android): fondo a sangre completa y K dentro de la zona segura (círculo del 80 %). */
export const iconoMaskable = () => svg(`<rect width="512" height="512" fill="${COLORES.marca}"/>${k(COLORES.blanco, 0.72)}`)

/** Apple touch: cuadrado sin transparencia (iOS redondea solo). */
export const iconoApple = () => svg(`<rect width="512" height="512" fill="${COLORES.marca}"/>${k(COLORES.blanco, 0.8)}`)

/** Variante oscura: K carmesí sobre fondo oscuro. */
export const iconoOscuro = () =>
  svg(`<rect width="512" height="512" rx="112" fill="${COLORES.superficieOscura}"/>${k(COLORES.marca, 0.92)}`)

/** Notificación: silueta blanca sobre transparente (exigencia de Android). */
export const iconoNotificacion = () => svg(k(COLORES.blanco, 1.12))

/** Logotipo horizontal: ícono + palabra KAIBU (texto convertido a trazos). */
export function logotipo(pathTexto, anchoTexto, colorTexto) {
  const alto = 512
  const separacion = 72
  const ancho = 512 + separacion + Math.ceil(anchoTexto) + 16
  return svg(
    `<rect width="512" height="512" rx="112" fill="${COLORES.marca}"/>${k(COLORES.blanco, 0.92)}` +
      `<path transform="translate(${512 + separacion} 0)" fill="${colorTexto}" d="${pathTexto}"/>`,
    ancho,
    alto,
  )
}
