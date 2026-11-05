// Ayudas de texto: límites de Discord, texto seguro para GitHub y lectura de respuestas libres.

/** Corta un texto al largo máximo (Discord rechaza campos más largos). */
function truncar(texto, max, vacio = '') {
  const t = String(texto ?? '').trim()
  if (!t) return vacio
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

/** Evita que un reporte notifique a gente en GitHub (@usuario) o rompa el formato. */
function paraGitHub(texto) {
  return String(texto ?? '')
    .replace(/@/g, '@​')
    .replace(/`{3,}/g, "'''")
    .replace(/</g, '‹')
    .replace(/>/g, '›')
}

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** "Sí" → true, "No" → false; cualquier duda ("no sé", "tal vez") → null. */
function leerSiNo(texto) {
  const t = sinTildes(String(texto ?? ''))
  if (/^no\s*se\b/.test(t)) return null
  if (/^(si|s|yes|claro|obvio|por supuesto)\b/.test(t)) return true
  if (/^(no|nop|nope|n)\b/.test(t)) return false
  return null
}

/** "$2.990" o "2990 pesos" → 2990. Solo montos entre $100 y $100.000. */
function leerPrecio(texto) {
  const coincide = String(texto ?? '').replace(/[$.\s]/g, '').match(/^\d+/)
  if (!coincide) return null
  const n = Number(coincide[0])
  return n >= 100 && n <= 100000 ? n : null
}

function describirPlataforma(texto) {
  return truncar(texto, 100, 'Sin dato')
}

/** Código de /vincular: 6 caracteres sin letras que se confunden (I, O, 0, 1). */
function codigoValido(texto) {
  const t = String(texto ?? '').trim().toUpperCase()
  return /^[A-HJ-NP-Z2-9]{6}$/.test(t) ? t : null
}

/** Número con formato chileno: 1.403 · 62,5 */
function numeroCL(valor, decimales = 0) {
  const [entero, fraccion] = Math.abs(valor).toFixed(decimales).split('.')
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '−' : ''}${fraccion ? `${conMiles},${fraccion}` : conMiles}`
}

module.exports = { truncar, paraGitHub, leerSiNo, leerPrecio, describirPlataforma, codigoValido, numeroCL }
