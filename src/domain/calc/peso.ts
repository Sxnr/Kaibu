// Peso: promedio móvil, ritmo real, proyección y avance de fase (sección 7).
import { diferenciaDias, sumarDias } from '../format/formato'
import type { Objetivo, RegistroPeso } from './types'

export interface PuntoPromedio extends RegistroPeso {
  /** Promedio de los registros de los últimos 7 días calendario (incluye el día). */
  promedio: number
}

const redondear = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d

function ordenar(registros: RegistroPeso[]): RegistroPeso[] {
  return [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function promedioMovil7(registros: RegistroPeso[]): PuntoPromedio[] {
  const orden = ordenar(registros)
  return orden.map((r) => {
    const desde = sumarDias(r.fecha, -6)
    const ventana = orden.filter((x) => x.fecha >= desde && x.fecha <= r.fecha)
    const promedio = ventana.reduce((s, x) => s + x.kg, 0) / ventana.length
    return { ...r, promedio: redondear(promedio) }
  })
}

function promedioEntre(registros: RegistroPeso[], desde: string, hasta: string): number | null {
  const v = registros.filter((r) => r.fecha >= desde && r.fecha <= hasta)
  if (v.length === 0) return null
  return v.reduce((s, r) => s + r.kg, 0) / v.length
}

/** Ritmo real en kg/semana: promedio de los últimos 7 días − promedio de los 7 anteriores. */
export function ritmoReal(registros: RegistroPeso[], hoy: string): number | null {
  const actual = promedioEntre(registros, sumarDias(hoy, -6), hoy)
  const anterior = promedioEntre(registros, sumarDias(hoy, -13), sumarDias(hoy, -7))
  if (actual === null || anterior === null) return null
  return redondear(actual - anterior)
}

/** Cambio semanal (promedio de cada semana − la anterior), de la más antigua a la más reciente. */
export function cambiosSemanales(registros: RegistroPeso[], hoy: string, semanas: number): number[] {
  const cambios: number[] = []
  for (let i = semanas - 1; i >= 0; i--) {
    const r = ritmoReal(registros, sumarDias(hoy, -7 * i))
    if (r !== null) cambios.push(r)
  }
  return cambios
}

/** Semanas completas entre el primer y el último registro. */
export function semanasDeDatos(registros: RegistroPeso[]): number {
  if (registros.length < 2) return 0
  const orden = ordenar(registros)
  return Math.floor(diferenciaDias(orden[0]!.fecha, orden.at(-1)!.fecha) / 7)
}

export interface EntradaProyeccion {
  pesoActual: number
  pesoMeta: number
  /** kg/semana con signo (negativo = bajando). */
  ritmoReal: number | null
  /** kg/semana planeados (positivo). */
  ritmoPlaneado: number
  objetivo: Objetivo
  semanasDatos: number
  hoy: string
}

export interface Proyeccion {
  fecha: string
  semanas: number
  basadoEn: 'real' | 'planeado'
}

/** Fecha estimada de llegada a la meta. Con menos de 2 semanas de datos usa el ritmo planeado. */
export function proyeccionLlegada(e: EntradaProyeccion): Proyeccion | null {
  if (e.objetivo === 'mantener') return null
  const falta = e.objetivo === 'perder' ? e.pesoActual - e.pesoMeta : e.pesoMeta - e.pesoActual
  const basadoEn = e.semanasDatos >= 2 && e.ritmoReal !== null ? 'real' : 'planeado'
  if (falta <= 0) return { fecha: e.hoy, semanas: 0, basadoEn }
  const avancePorSemana =
    basadoEn === 'real' ? (e.objetivo === 'perder' ? -(e.ritmoReal ?? 0) : (e.ritmoReal ?? 0)) : e.ritmoPlaneado
  if (avancePorSemana <= 0) return null
  const semanas = Math.ceil(redondear(falta / avancePorSemana, 4))
  return { fecha: sumarDias(e.hoy, semanas * 7), semanas, basadoEn }
}

/** Porcentaje logrado de la fase (0–100). */
export function avanceFase(inicio: number, actual: number, meta: number): number {
  const total = meta - inicio
  if (total === 0) return 100
  const pct = ((actual - inicio) / total) * 100
  return redondear(Math.min(100, Math.max(0, pct)), 1)
}
