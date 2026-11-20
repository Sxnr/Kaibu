// Repartir una comida en varios días y repetir semanas (lógica pura).
import { desdeISO, sumarDias } from '../format/formato'
import { FECHA_MAX_DIAS } from './calendario'

/** Días entre `desde` y `hasta` (incluidos) cuyo día de la semana está en `dias` (0 = domingo … 6 = sábado). */
export function diasParaRepartir(desde: string, hasta: string, dias: readonly number[]): string[] {
  const elegidos = new Set(dias)
  const salida: string[] = []
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) if (elegidos.has(desdeISO(f).getDay())) salida.push(f)
  return salida
}

/** La misma fecha en las `semanas` siguientes, sin pasarse del límite de planificación. */
export function fechasRepetidas(fecha: string, semanas: number, hoy: string): string[] {
  const limite = sumarDias(hoy, FECHA_MAX_DIAS)
  return Array.from({ length: semanas }, (_, i) => sumarDias(fecha, 7 * (i + 1))).filter((f) => f <= limite)
}
