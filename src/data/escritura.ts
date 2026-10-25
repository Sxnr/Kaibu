// Escrituras locales: se guardan al instante en el dispositivo y quedan en cola para subir.
import { ahoraISO, db, type NombreTabla } from './db'
import { USUARIO_LOCAL } from './supabase'
import { TABLAS } from './tablas'

type Oyente = () => void
const oyentes = new Set<Oyente>()

/** Avisa cuando hay cambios para subir (la sesión programa la sincronización). */
export function alCambiarDatos(fn: Oyente): () => void {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

export async function guardar<T extends { userId: string }>(tabla: NombreTabla, fila: T): Promise<T> {
  const cfg = TABLAS[tabla]
  const conFecha = { ...fila, updatedAt: ahoraISO() }
  await db.transaction('rw', cfg.local(), db.pendientes, async () => {
    await cfg.local().put(conFecha)
    if (fila.userId !== USUARIO_LOCAL) {
      await db.pendientes.add({ tabla, clave: cfg.clave(conFecha as Record<string, unknown>) })
    }
  })
  oyentes.forEach((fn) => fn())
  return conFecha
}

/** Borrado suave (se puede deshacer guardando la fila anterior). */
export async function borrar<T extends { userId: string; deletedAt: string | null }>(
  tabla: NombreTabla,
  fila: T,
): Promise<T> {
  return guardar(tabla, { ...fila, deletedAt: ahoraISO() })
}

export async function guardarVarios<T extends { userId: string }>(tabla: NombreTabla, filas: T[]): Promise<void> {
  const cfg = TABLAS[tabla]
  const ahora = ahoraISO()
  await db.transaction('rw', cfg.local(), db.pendientes, async () => {
    for (const fila of filas) {
      const conFecha = { ...fila, updatedAt: ahora }
      await cfg.local().put(conFecha)
      if (fila.userId !== USUARIO_LOCAL) {
        await db.pendientes.add({ tabla, clave: cfg.clave(conFecha as Record<string, unknown>) })
      }
    }
  })
  oyentes.forEach((fn) => fn())
}
