// Búsqueda de alimentos sin tildes ni mayúsculas, con sinónimos chilenos.
import type { Alimento } from './tipos'

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Palabras que significan lo mismo (cómo se escribe en Chile, en otros países o en las etiquetas).
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

/** "huevos" → ["huevos", "huevo"]; "frijoles" → [..., "frijol"]. */
function raices(palabra: string): string[] {
  const r = [palabra]
  if (palabra.length > 4 && palabra.endsWith('es')) r.push(palabra.slice(0, -2))
  if (palabra.length > 3 && palabra.endsWith('s')) r.push(palabra.slice(0, -1))
  return r
}

const SINONIMOS = new Map<string, string[]>()
for (const grupo of GRUPOS_SINONIMOS) for (const p of grupo) SINONIMOS.set(p, grupo)

// Se calcula una vez por palabra (la búsqueda recorre miles de productos por cada tecla).
const cacheVariantes = new Map<string, string[]>()

/** Formas que se aceptan para una palabra buscada: ella, su singular y sus sinónimos. */
function variantes(palabra: string): string[] {
  const guardadas = cacheVariantes.get(palabra)
  if (guardadas) return guardadas
  const formas = new Set<string>()
  for (const r of raices(palabra)) {
    formas.add(r)
    for (const s of SINONIMOS.get(r) ?? []) formas.add(s)
  }
  const lista = [...formas]
  if (cacheVariantes.size > 500) cacheVariantes.clear()
  cacheVariantes.set(palabra, lista)
  return lista
}

/** Puntaje de coincidencia (0 = no coincide). Más alto = mejor. */
export function puntaje(alimento: Pick<Alimento, 'nombre' | 'alias' | 'marca'>, consulta: string): number {
  const q = normalizar(consulta)
  if (!q) return 0
  const nombre = normalizar(alimento.nombre)
  const marca = normalizar(alimento.marca ?? '')
  const extra = normalizar([...(alimento.alias ?? []), marca].join(' '))
  const palabras = q.split(' ')
  const coincide = (p: string) => variantes(p).some((v) => nombre.includes(v) || extra.includes(v))
  if (!palabras.every(coincide)) return 0
  // Si la persona escribió la marca ("soprole protein"), ese producto va primero.
  const bonoMarca = marca && palabras.some((p) => p.length > 2 && marca.includes(p)) ? 15 : 0
  if (nombre === q) return 100
  if (nombre.startsWith(q)) return 80 + bonoMarca
  if (nombre.split(' ').some((w) => variantes(palabras[0]!).some((v) => w.startsWith(v)))) return 60 + bonoMarca
  if (nombre.includes(q)) return 50 + bonoMarca
  return 30 + bonoMarca
}

export function buscarAlimentos<T extends Pick<Alimento, 'nombre' | 'alias' | 'marca'>>(
  lista: T[],
  consulta: string,
  limite = 30,
): T[] {
  return lista
    .map((a) => ({ a, p: puntaje(a, consulta) }))
    .filter((x) => x.p > 0)
    .sort((x, y) => y.p - x.p || x.a.nombre.length - y.a.nombre.length)
    .slice(0, limite)
    .map((x) => x.a)
}
