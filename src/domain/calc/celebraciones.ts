// Logros al terminar el día (RF-24) y avisos de seguridad pendientes (RF-11): cada uno se muestra una vez.
import { sumarDias } from '../format/formato'
import type { AvisoSeguridad } from './ajustes'

export type TipoLogro = 'meta' | 'kg' | 'racha' | 'dia'

export interface Logro {
  tipo: TipoLogro
  /** Identifica el logro para no repetirlo. */
  clave: string
  /** Número que acompaña al logro (días de racha o kilos). */
  cantidad: number
}

export const HITOS_RACHA = [3, 7, 14, 30] as const

export interface EntradaLogros {
  hoy: string
  cumplido: boolean
  racha: number
  /** Kilos avanzados hacia la meta en la fase actual (según el promedio de 7 días). */
  kgAvanzados: number
  metaAlcanzada: boolean
  faseInicio: string | null
  celebrados: ReadonlySet<string>
}

/** Logros nuevos al terminar el día, del más importante al menos importante. */
export function logrosAlTerminar(e: EntradaLogros): Logro[] {
  const fase = e.faseInicio ?? 'sin-fase'
  const candidatos: Logro[] = []
  if (e.metaAlcanzada) candidatos.push({ tipo: 'meta', clave: `meta:${fase}`, cantidad: 0 })
  const kilos = Math.floor(e.kgAvanzados)
  if (kilos >= 1) candidatos.push({ tipo: 'kg', clave: `kg:${kilos}:${fase}`, cantidad: kilos })
  if (e.cumplido && (HITOS_RACHA as readonly number[]).includes(e.racha)) {
    const inicioRacha = sumarDias(e.hoy, -(e.racha - 1))
    candidatos.push({ tipo: 'racha', clave: `racha:${e.racha}:${inicioRacha}`, cantidad: e.racha })
  }
  if (e.cumplido) candidatos.push({ tipo: 'dia', clave: `dia:${e.hoy}`, cantidad: 0 })
  return candidatos.filter((l) => !e.celebrados.has(l.clave))
}

export function claveAviso(aviso: AvisoSeguridad, faseInicio: string | null): string {
  return `${aviso}:${faseInicio ?? 'sin-fase'}`
}

/** Avisos que aún no se mostraron en esta fase. */
export function avisosPendientes(avisos: AvisoSeguridad[], vistos: ReadonlySet<string>, faseInicio: string | null): AvisoSeguridad[] {
  return avisos.filter((a) => !vistos.has(claveAviso(a, faseInicio)))
}
