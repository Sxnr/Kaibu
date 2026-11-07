// Búsqueda de alimentos del bot: la misma lógica que la app (src/domain/alimentos/busqueda.ts),
// sin tildes ni mayúsculas, con sinónimos, plurales y marca. Si cambia allá, actualizar aquí.

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const GRUPOS_SINONIMOS = [
  ['yogur', 'yogurt', 'yoghurt', 'yoghourt'],
  ['proteina', 'protein', 'proteico', 'proteica'],
  ['palta', 'aguacate'],
  ['poroto', 'frijol', 'caraota', 'judia'],
  ['choclo', 'maiz', 'elote'],
  ['frutilla', 'fresa'],
  ['durazno', 'melocoton'],
  ['zapallo', 'calabaza', 'auyama'],
  ['arveja', 'guisante', 'chicharo'],
  ['papa', 'patata'],
  ['camote', 'batata', 'boniato'],
  ['betarraga', 'remolacha'],
  ['pimenton', 'pimiento', 'morron'],
  ['sandwich', 'sanguche', 'sandwiche'],
  ['jugo', 'zumo'],
  ['bebida', 'gaseosa', 'refresco'],
  ['batido', 'shake', 'malteada'],
  ['queque', 'bizcocho'],
]
const SINONIMOS = new Map(GRUPOS_SINONIMOS.flatMap((g) => g.map((p) => [p, g])))

/** "huevos" → ["huevos", "huevo"]; "frijoles" → [..., "frijol"]. */
function raices(palabra) {
  const r = [palabra]
  if (palabra.length > 4 && palabra.endsWith('es')) r.push(palabra.slice(0, -2))
  if (palabra.length > 3 && palabra.endsWith('s')) r.push(palabra.slice(0, -1))
  return r
}

function variantes(palabra) {
  const formas = new Set()
  for (const r of raices(palabra)) {
    formas.add(r)
    for (const s of SINONIMOS.get(r) ?? []) formas.add(s)
  }
  return [...formas]
}

/** Puntaje de coincidencia (0 = no coincide) para un alimento { n: nombre, m?: marca, a?: alias[] }. */
function puntaje(alimento, consulta) {
  const q = normalizar(consulta)
  if (!q) return 0
  const nombre = normalizar(alimento.n)
  const marca = normalizar(alimento.m ?? '')
  const extra = normalizar([...(alimento.a ?? []), marca].join(' '))
  const palabras = q.split(' ')
  const coincide = (p) => variantes(p).some((v) => nombre.includes(v) || extra.includes(v))
  if (!palabras.every(coincide)) return 0
  const bonoMarca = marca && palabras.some((p) => p.length > 2 && marca.includes(p)) ? 15 : 0
  if (nombre === q) return 100
  if (nombre.startsWith(q)) return 80 + bonoMarca
  if (nombre.split(' ').some((w) => variantes(palabras[0]).some((v) => w.startsWith(v)))) return 60 + bonoMarca
  if (nombre.includes(q)) return 50 + bonoMarca
  return 30 + bonoMarca
}

/** Los mejores resultados: primero el puntaje, luego el nombre más corto (lo más genérico). */
function buscarAlimentos(lista, consulta, limite = 10) {
  return lista
    .map((a) => ({ a, p: puntaje(a, consulta) }))
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p || x.a.n.length - y.a.n.length)
    .slice(0, limite)
    .map((x) => x.a)
}

/** Valores de una porción (redondeados como en la app). */
function porPorcion(a) {
  const f = (a.pg ?? 100) / 100
  const r1 = (n) => Math.round(n * f * 10) / 10
  return { kcal: Math.round(a.k * f), proteina: r1(a.p), carbos: r1(a.c), grasas: r1(a.g) }
}

module.exports = { normalizar, puntaje, buscarAlimentos, porPorcion }
