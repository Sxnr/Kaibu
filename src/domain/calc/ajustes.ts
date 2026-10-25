// Ajuste semanal, límites de seguridad y transición de fases (sección 7).
import type { Objetivo, Sexo } from './types'

export interface EntradaSugerencia {
  objetivo: Objetivo
  /** kg/semana planeados (positivo). */
  ritmoPlaneado: number
  /** Cambios de peso semanales, del más antiguo al más reciente (negativo = bajó). */
  cambiosSemanales: number[]
  pesoKg: number
}

export interface Sugerencia {
  deltaKcal: number
  motivo: string
}

/** Sugerencia de ajuste (el usuario la acepta o la rechaza). Null si no hace falta. */
export function sugerenciaSemanal({ objetivo, ritmoPlaneado, cambiosSemanales, pesoKg }: EntradaSugerencia): Sugerencia | null {
  if (objetivo === 'mantener' || cambiosSemanales.length === 0) return null
  // Avance a favor del objetivo: en déficit, bajar es positivo; en volumen, subir.
  const avance = cambiosSemanales.map((c) => (objetivo === 'perder' ? -c : c))
  const ultimo = avance.at(-1)!
  const pctUltimo = (ultimo / pesoKg) * 100

  if (pctUltimo > 1) {
    const delta = objetivo === 'perder' ? (pctUltimo > 1.5 ? 200 : 150) : -150
    return {
      deltaKcal: delta,
      motivo:
        objetivo === 'perder'
          ? 'Esta semana bajaste más de 1 % de tu peso. Sumar un poco de energía ayuda a cuidar tu músculo.'
          : 'Esta semana subiste más de 1 % de tu peso. Bajar un poco evita ganar grasa de más.',
    }
  }

  const ultimas2 = avance.slice(-2)
  if (ultimas2.length === 2 && ultimas2.every((a) => a < ritmoPlaneado * 0.5)) {
    return {
      deltaKcal: objetivo === 'perder' ? -150 : 150,
      motivo:
        objetivo === 'perder'
          ? 'Las últimas 2 semanas bajaste menos de la mitad de lo planeado.'
          : 'Las últimas 2 semanas subiste menos de la mitad de lo planeado.',
    }
  }
  return null
}

export type AvisoSeguridad = 'kcal_bajo_minimo' | 'ritmo_alto'

export const KCAL_MINIMAS: Record<Sexo, number> = { hombre: 1500, mujer: 1200 }

export function avisosSeguridad(e: {
  sexo: Sexo
  kcalObjetivo: number
  ritmoKgSemana: number
  pesoKg: number
}): AvisoSeguridad[] {
  const avisos: AvisoSeguridad[] = []
  if (e.kcalObjetivo < KCAL_MINIMAS[e.sexo]) avisos.push('kcal_bajo_minimo')
  if (e.pesoKg > 0 && (e.ritmoKgSemana / e.pesoKg) * 100 > 1) avisos.push('ritmo_alto')
  return avisos
}

/** ¿Se llegó a la meta de la fase según el peso promedio? */
export function metaAlcanzada(objetivo: Objetivo, pesoPromedio: number, pesoMeta: number): boolean {
  if (objetivo === 'perder') return pesoPromedio <= pesoMeta
  if (objetivo === 'ganar') return pesoPromedio >= pesoMeta
  return false
}

/** Pasos semanales de kcal para subir gradualmente (+100 a +150 por semana) hasta el destino. */
export function planTransicion(kcalActual: number, kcalDestino: number, paso = 150): number[] {
  const pasos: number[] = []
  let actual = kcalActual
  while (actual < kcalDestino) {
    actual = Math.min(kcalDestino, actual + paso)
    pasos.push(actual)
  }
  return pasos
}
