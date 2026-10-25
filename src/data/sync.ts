// Sincronización: sube los cambios locales pendientes y baja los cambios del servidor.
// Regla de conflicto simple: gana el último cambio; un cambio local pendiente nunca se pisa.
import type { SupabaseClient } from '@supabase/supabase-js'
import { db, type NombreTabla } from './db'
import { ORDEN_TABLAS, TABLAS } from './tablas'

type Fila = Record<string, unknown>

/** Operaciones remotas mínimas (se puede reemplazar en pruebas). */
export interface Remoto {
  upsert(tabla: string, filas: Fila[], conflicto: string): Promise<void>
  agregar(tabla: string, filas: Fila[]): Promise<void>
  cambiosDesde(tabla: string, userId: string, desde: string | null, limite: number): Promise<Fila[]>
}

export function remotoSupabase(cliente: SupabaseClient): Remoto {
  return {
    async upsert(tabla, filas, conflicto) {
      const { error } = await cliente.from(tabla).upsert(filas, { onConflict: conflicto })
      if (error) throw new Error(`${tabla}: ${error.message}`)
    },
    async agregar(tabla, filas) {
      for (const fila of filas) {
        const { error } = await cliente.from(tabla).insert(fila)
        // 23505 = ya existía (se subió antes): no es un error.
        if (error && error.code !== '23505') throw new Error(`${tabla}: ${error.message}`)
      }
    },
    async cambiosDesde(tabla, userId, desde, limite) {
      let consulta = cliente.from(tabla).select('*').eq('user_id', userId).order('updated_at').limit(limite)
      if (desde) consulta = consulta.gte('updated_at', desde)
      const { data, error } = await consulta
      if (error) throw new Error(`${tabla}: ${error.message}`)
      return (data ?? []) as Fila[]
    },
  }
}

const LOTE_SUBIDA = 100
const PAGINA_BAJADA = 1000

/** Sube los cambios pendientes en orden. Devuelve cuántos se subieron. */
export async function subirPendientes(remoto: Remoto): Promise<number> {
  const pendientes = await db.pendientes.orderBy('seq').toArray()
  if (pendientes.length === 0) return 0
  let subidos = 0
  for (const nombre of ORDEN_TABLAS) {
    const cfg = TABLAS[nombre]
    const deEsta = pendientes.filter((p) => p.tabla === nombre)
    for (let i = 0; i < deEsta.length; i += LOTE_SUBIDA) {
      const lote = deEsta.slice(i, i + LOTE_SUBIDA)
      // Una sola versión por clave: la fila actual del dispositivo.
      const claves = [...new Set(lote.map((p) => p.clave))]
      const filas = (await Promise.all(claves.map((c) => cfg.local().get(cfg.claveDexie(c))))).filter(Boolean) as Fila[]
      const remotas = filas.map((f) => cfg.aRemota(f))
      if (remotas.length > 0) {
        if (cfg.soloAgregar) await remoto.agregar(cfg.remota, remotas)
        else await remoto.upsert(cfg.remota, remotas, cfg.conflicto)
      }
      await db.pendientes.bulkDelete(lote.map((p) => p.seq!))
      subidos += lote.length
    }
  }
  return subidos
}

const claveCursor = (userId: string, tabla: NombreTabla) => `cursor:${userId}:${tabla}`

/** Baja los cambios del servidor desde la última sincronización. Devuelve filas recibidas. */
export async function bajarCambios(remoto: Remoto, userId: string): Promise<number> {
  let recibidas = 0
  for (const nombre of ORDEN_TABLAS) {
    const cfg = TABLAS[nombre]
    let desde = (await db.meta.get(claveCursor(userId, nombre)))?.valor ?? null
    for (;;) {
      const filas = await remoto.cambiosDesde(cfg.remota, userId, desde, PAGINA_BAJADA)
      if (filas.length === 0) break
      const locales = filas.map((f) => cfg.aLocal(f))
      await db.transaction('rw', cfg.local(), db.pendientes, async () => {
        for (const fila of locales) {
          const clave = cfg.clave(fila)
          const pendiente = await db.pendientes.where('[tabla+clave]').equals([nombre, clave]).first()
          if (!pendiente) await cfg.local().put(fila)
        }
      })
      recibidas += filas.length
      const ultimo = String(filas.at(-1)!.updated_at)
      await db.meta.put({ clave: claveCursor(userId, nombre), valor: ultimo })
      if (filas.length < PAGINA_BAJADA || ultimo === desde) break
      desde = ultimo
    }
  }
  return recibidas
}

export interface ResultadoSync {
  subidos: number
  recibidos: number
  en: string
}

let enCurso: Promise<ResultadoSync> | null = null

/** Sincroniza (una sola ejecución a la vez). */
export function sincronizar(remoto: Remoto, userId: string): Promise<ResultadoSync> {
  if (enCurso) return enCurso
  enCurso = (async () => {
    try {
      const subidos = await subirPendientes(remoto)
      const recibidos = await bajarCambios(remoto, userId)
      await db.meta.put({ clave: `sync-inicial:${userId}`, valor: new Date().toISOString() })
      return { subidos, recibidos, en: new Date().toISOString() }
    } finally {
      enCurso = null
    }
  })()
  return enCurso
}

export async function huboSyncInicial(userId: string): Promise<boolean> {
  return !!(await db.meta.get(`sync-inicial:${userId}`))
}
