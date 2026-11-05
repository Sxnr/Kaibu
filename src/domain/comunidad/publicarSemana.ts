// Datos que la app manda para publicar "Mi semana" en el Discord (función publicar_semana_discord).
// Son los mismos números de la imagen para historias: el peso solo va si la persona lo activa.
import type { Periodo, ResumenPeriodo } from '../calc/resumenSemanal'
import type { Objetivo } from '../calc/types'

export interface EntradaPublicacion {
  resumen: ResumenPeriodo
  periodo: Periodo
  racha: number
  objetivo: Objetivo
  kgAvanzados: number
  pesoKg: number | null
  mostrarPeso: boolean
}

export interface ParametrosPublicacion {
  p_periodo: Periodo
  p_dias_anotados: number
  p_dias_total: number
  p_dias_kcal: number
  p_dias_proteina: number
  p_racha: number
  p_kg_avanzados: number | null
  p_peso_kg: number | null
}

const r1 = (n: number) => Math.round(n * 10) / 10

export function datosPublicacion(e: EntradaPublicacion): ParametrosPublicacion {
  const { resumen: r } = e
  const conAvance = e.objetivo !== 'mantener' && e.kgAvanzados > 0
  return {
    p_periodo: e.periodo,
    p_dias_anotados: r.diasConRegistro,
    p_dias_total: Math.max(1, r.diasTranscurridos),
    p_dias_kcal: r.diasKcal,
    p_dias_proteina: r.diasProteina,
    p_racha: Math.max(0, e.racha),
    p_kg_avanzados: conAvance ? r1(e.objetivo === 'perder' ? -e.kgAvanzados : e.kgAvanzados) : null,
    p_peso_kg: e.mostrarPeso && e.pesoKg !== null ? r1(e.pesoKg) : null,
  }
}
