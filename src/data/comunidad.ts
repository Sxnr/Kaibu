// Catálogo colaborativo: aportes de todos (copia local para buscar sin conexión) y búsqueda por código de barras
// en el catálogo de Kaibu, la comunidad y Open Food Facts (licencia ODbL).
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLiveQuery } from 'dexie-react-hooks'
import { productoDesdeOff, type ProductoOffCrudo } from '@/domain/alimentos/off'
import type { Alimento } from '@/domain/alimentos/tipos'
import { db, type Aporte, type Externo } from './db'
import { TABLAS } from './tablas'

type Fila = Record<string, unknown>
const CURSOR = 'comunidad:cursor'
const PAGINA = 1000
const FUENTE_COMUNIDAD = 'Aporte de la comunidad de Kaibu (datos de la etiqueta)'
const URL_OFF = 'https://world.openfoodfacts.org/api/v2/product'
const ESPERA_OFF_MS = 8000

/** Trae de Supabase los aportes cambiados después de "desde" (los ve cualquier cuenta). */
export function traerComunidad(cliente: SupabaseClient) {
  return async (desde: string | null): Promise<Fila[]> => {
    let consulta = cliente.from('community_foods').select('*').order('updated_at').limit(PAGINA)
    if (desde) consulta = consulta.gt('updated_at', desde)
    const { data, error } = await consulta
    if (error) throw new Error(`community_foods: ${error.message}`)
    return (data ?? []) as Fila[]
  }
}

/** Baja los aportes nuevos o cambiados de toda la comunidad. Devuelve cuántos llegaron. */
export async function bajarComunidad(traer: (desde: string | null) => Promise<Fila[]>): Promise<number> {
  let desde = (await db.meta.get(CURSOR))?.valor ?? null
  let total = 0
  for (;;) {
    const filas = await traer(desde)
    if (filas.length === 0) break
    await db.comunidad.bulkPut(filas.map((f) => TABLAS.aportes.aLocal(f) as unknown as Aporte))
    desde = String(filas.at(-1)!.updated_at)
    await db.meta.put({ clave: CURSOR, valor: desde })
    total += filas.length
    if (filas.length < PAGINA) break
  }
  return total
}

export function alimentoDesdeAporte(a: Aporte): Alimento {
  return {
    clave: `comunidad:${a.id}`,
    origen: 'catalogo',
    nombre: a.nombre,
    marca: a.marca,
    categoria: 'Comunidad',
    kcal: a.kcal,
    proteina: a.proteina,
    carbos: a.carbos,
    grasas: a.grasas,
    porcion: a.porcionG ? { nombre: a.porcionNombre || `${a.porcionG} g`, g: a.porcionG } : null,
    fuente: FUENTE_COMUNIDAD,
    codigo: a.codigo,
    comunidad: { id: a.id, userId: a.userId, estado: a.estado, confirmaciones: a.confirmaciones, reportes: a.reportes },
  }
}

/** Aportes visibles (de todos y los míos aún sin subir), sin duplicados ni ocultos. */
export async function alimentosComunidad(): Promise<Alimento[]> {
  const porId = new Map<string, Aporte>()
  for (const a of await db.comunidad.toArray()) porId.set(a.id, a)
  for (const a of await db.aportes.toArray()) porId.set(a.id, { ...porId.get(a.id), ...a, ...conteos(porId.get(a.id)) })
  return [...porId.values()].filter((a) => !a.deletedAt && a.estado !== 'oculto').map(alimentoDesdeAporte)
}

/** Mis aportes guardan los conteos que calculó el servidor (vienen en la copia de la comunidad). */
function conteos(a?: Aporte): Partial<Aporte> {
  return a ? { confirmaciones: a.confirmaciones, reportes: a.reportes, estado: a.estado } : {}
}

export function useComunidad(): Alimento[] {
  return useLiveQuery(alimentosComunidad, [], [])
}

function alimentoDesdeExterno(e: Externo): Alimento {
  return {
    clave: e.clave,
    origen: 'catalogo',
    nombre: e.nombre,
    marca: e.marca,
    categoria: 'Productos con marca',
    kcal: e.kcal,
    proteina: e.proteina,
    carbos: e.carbos,
    grasas: e.grasas,
    porcion: e.porcionG ? { nombre: e.porcionNombre || `${e.porcionG} g`, g: e.porcionG } : null,
    fuente: e.fuente,
    codigo: e.codigo,
  }
}

/** Productos encontrados antes por código (para que recientes y favoritos los muestren). */
export function useExternos(): Alimento[] {
  return useLiveQuery(async () => (await db.externos.toArray()).map(alimentoDesdeExterno), [], [])
}

/** Consulta un código en Open Food Facts (todos los países). null si no existe o no hay conexión. */
export async function traerDeOff(codigo: string): Promise<ProductoOffCrudo | null> {
  const campos = 'code,product_name,product_name_es,brands,serving_size,serving_quantity,nutriments'
  const res = await fetch(`${URL_OFF}/${codigo}.json?fields=${campos}`, { signal: AbortSignal.timeout(ESPERA_OFF_MS) })
  if (!res.ok) return null
  const datos = (await res.json()) as { status?: number; product?: ProductoOffCrudo }
  return datos.status === 1 && datos.product ? { ...datos.product, code: datos.product.code ?? codigo } : null
}

export type OrigenCodigo = 'catalogo' | 'comunidad' | 'off'

/** Busca un código de barras: catálogo de Kaibu → comunidad → Open Food Facts. null si no está en ninguna parte. */
export async function buscarPorCodigo(
  codigo: string,
  productos: Alimento[],
  traerOff: (codigo: string) => Promise<ProductoOffCrudo | null> = traerDeOff,
): Promise<{ alimento: Alimento; origen: OrigenCodigo } | null> {
  const delCatalogo = productos.find((p) => p.codigo === codigo)
  if (delCatalogo) return { alimento: delCatalogo, origen: 'catalogo' }

  const deLaComunidad = (await alimentosComunidad())
    .filter((a) => a.codigo === codigo)
    .sort((x, y) => Number(y.comunidad?.estado === 'verificado') - Number(x.comunidad?.estado === 'verificado') || (y.comunidad?.confirmaciones ?? 0) - (x.comunidad?.confirmaciones ?? 0))[0]
  if (deLaComunidad) return { alimento: deLaComunidad, origen: 'comunidad' }

  const guardado = await db.externos.get(`off:${codigo}`)
  if (guardado) return { alimento: alimentoDesdeExterno(guardado), origen: 'off' }

  const crudo = await traerOff(codigo).catch(() => null)
  const p = crudo ? productoDesdeOff(crudo) : null
  if (!p) return null
  const externo: Externo = {
    clave: `off:${p.codigo}`,
    codigo: p.codigo,
    nombre: p.nombre,
    marca: p.marca,
    kcal: p.kcal,
    proteina: p.proteina,
    carbos: p.carbos,
    grasas: p.grasas,
    porcionNombre: p.porcion.nombre,
    porcionG: p.porcion.g,
    fuente: p.fuente,
    guardadoEn: new Date().toISOString(),
  }
  await db.externos.put(externo)
  return { alimento: alimentoDesdeExterno(externo), origen: 'off' }
}
