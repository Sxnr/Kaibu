// Fechas del historial y de la planificación (lógica pura).
import { aISO, desdeISO, sumarDias } from '../format/formato'

/** Se puede planificar hasta 8 semanas hacia adelante. */
export const FECHA_MAX_DIAS = 56

const ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** ¿La fecha es válida y no pasa del límite del plan? (los días pasados siempre se pueden ver). */
export function enRangoPlan(fecha: string, hoy: string): boolean {
  return ISO.test(fecha) && fecha <= sumarDias(hoy, FECHA_MAX_DIAS)
}

/** Fecha del parámetro "?fecha=" si es válida; si no, hoy. */
export function fechaElegida(param: string | null, hoy: string): string {
  return param && enRangoPlan(param, hoy) ? param : hoy
}

/** Semanas (lunes a domingo) del mes de la fecha; los huecos fuera del mes son null. */
export function calendarioMes(iso: string): (string | null)[][] {
  const [a, m] = iso.split('-').map(Number) as [number, number]
  const primero = aISO(new Date(a, m - 1, 1, 12))
  const diasMes = new Date(a, m, 0).getDate()
  const hueco = (desdeISO(primero).getDay() + 6) % 7
  const celdas: (string | null)[] = [...Array<null>(hueco).fill(null), ...Array.from({ length: diasMes }, (_, i) => sumarDias(primero, i))]
  while (celdas.length % 7 !== 0) celdas.push(null)
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7))
}

export function mesSiguiente(iso: string): string {
  const [a, m] = iso.split('-').map(Number) as [number, number]
  return aISO(new Date(a, m, 1, 12))
}

export function mesAnterior(iso: string): string {
  const [a, m] = iso.split('-').map(Number) as [number, number]
  return aISO(new Date(a, m - 2, 1, 12))
}
