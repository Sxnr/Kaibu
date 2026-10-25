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

/** Puntaje de coincidencia (0 = no coincide). Más alto = mejor. */
export function puntaje(alimento: Pick<Alimento, 'nombre' | 'alias' | 'marca'>, consulta: string): number {
  const q = normalizar(consulta)
  if (!q) return 0
  const nombre = normalizar(alimento.nombre)
  const extra = normalizar([...(alimento.alias ?? []), alimento.marca ?? ''].join(' '))
  const palabras = q.split(' ')
  if (!palabras.every((p) => nombre.includes(p) || extra.includes(p))) return 0
  if (nombre === q) return 100
  if (nombre.startsWith(q)) return 80
  if (nombre.split(' ').some((w) => w.startsWith(palabras[0]!))) return 60
  if (nombre.includes(q)) return 50
  return 30
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
