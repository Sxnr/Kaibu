// Consultas reactivas: la interfaz se actualiza sola cuando cambian los datos del dispositivo.
import { useLiveQuery } from 'dexie-react-hooks'
import type { Alimento } from '@/domain/alimentos/tipos'
import { activo, db, type MiAlimento, type RegistroComida } from './db'

/**
 * useLiveQuery conserva el resultado ANTERIOR mientras calcula uno nuevo cuando cambian
 * sus dependencias. Aquí cada resultado lleva su clave: si no coincide con la consulta
 * actual se devuelve undefined ("cargando") y nunca datos de otra consulta.
 */
function useConsulta<T>(deps: unknown[], querier: () => Promise<T>): T | undefined {
  const clave = JSON.stringify(deps)
  const r = useLiveQuery(async () => ({ clave, valor: await querier() }), [clave])
  return r && r.clave === clave ? r.valor : undefined
}

export function usePerfil(userId: string | null) {
  return useConsulta(['perfil', userId], async () => (userId ? ((await db.perfiles.get(userId)) ?? null) : null))
}

export function useRegistrosDia(userId: string | null, fecha: string) {
  return useConsulta(['registros-dia', userId, fecha], async () =>
    userId
      ? (await db.registros.where('[userId+fecha]').equals([userId, fecha]).toArray())
          .filter((r) => r.deletedAt === null)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : [],
  )
}

export function useRegistrosRango(userId: string | null, desde: string, hasta: string) {
  return useConsulta(['registros-rango', userId, desde, hasta], async () =>
    userId
      ? (await db.registros.where('[userId+fecha]').between([userId, desde], [userId, hasta], true, true).toArray()).filter(
          (r) => r.deletedAt === null,
        )
      : [],
  )
}

export function usePesos(userId: string | null) {
  return useConsulta(['pesos', userId], async () =>
    userId
      ? (await db.pesos.where('userId').equals(userId).toArray())
          .filter((p) => p.deletedAt === null)
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
      : [],
  )
}

export function useMisAlimentos(userId: string | null) {
  return useConsulta(['mis-alimentos', userId], async () =>
    userId
      ? (await db.misAlimentos.where('userId').equals(userId).toArray())
          .filter((a) => a.deletedAt === null)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      : [],
  )
}

export function useFavoritos(userId: string | null) {
  return useConsulta(['favoritos', userId], async () =>
    userId
      ? new Set(
          (await db.favoritos.where('userId').equals(userId).toArray()).filter((f) => f.deletedAt === null).map((f) => f.alimentoClave),
        )
      : new Set<string>(),
  )
}

export function useConsentimientos(userId: string | null) {
  return useConsulta(['consentimientos', userId], async () =>
    userId ? (await db.consentimientos.where('userId').equals(userId).toArray()).filter(activo) : [],
  )
}

/** Últimos registros únicos por alimento (para "Recientes"), del más nuevo al más antiguo. */
export function useRecientes(userId: string | null, limite = 30) {
  return useConsulta(['recientes', userId, limite], async () => {
    if (!userId) return [] as RegistroComida[]
    const todos = (await db.registros.where('userId').equals(userId).toArray())
      .filter((r) => r.deletedAt === null && r.origen !== 'rapido')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const vistos = new Set<string>()
    const unicos: RegistroComida[] = []
    for (const r of todos) {
      const clave = r.alimentoClave ?? r.nombre
      if (vistos.has(clave)) continue
      vistos.add(clave)
      unicos.push(r)
      if (unicos.length >= limite) break
    }
    return unicos
  })
}

export function miAlimentoAAlimento(m: MiAlimento): Alimento {
  return {
    clave: `mio:${m.id}`,
    origen: 'mio',
    nombre: m.nombre,
    marca: m.marca,
    kcal: m.kcal,
    proteina: m.proteina,
    carbos: m.carbos,
    grasas: m.grasas,
    porcion: m.porcionG ? { nombre: m.porcionNombre || '1 porción', g: m.porcionG } : null,
    categoria: 'Mis alimentos',
  }
}
