// Energía: metabolismo basal, mantenimiento, objetivo calórico y agua (sección 7).
import type { ActividadDiaria, NivelFactor, Objetivo, Sexo, Velocidad } from './types'

export const KCAL_POR_KG = 7700

/** Años cumplidos a una fecha dada. */
export function calcularEdad(fechaNacimiento: string, hoy: Date = new Date()): number {
  const [a, m, d] = fechaNacimiento.split('-').map(Number) as [number, number, number]
  let edad = hoy.getFullYear() - a
  const antesDelCumple = hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)
  if (antesDelCumple) edad -= 1
  return edad
}

export interface DatosBasal {
  sexo: Sexo
  pesoKg: number
  estaturaCm: number
  edad: number
}

/** Metabolismo basal con la fórmula de Mifflin-St Jeor. */
export function metabolismoBasal({ sexo, pesoKg, estaturaCm, edad }: DatosBasal): number {
  if (pesoKg <= 0 || estaturaCm <= 0 || edad <= 0) {
    throw new RangeError('Peso, estatura y edad deben ser mayores a cero')
  }
  const base = 10 * pesoKg + 6.25 * estaturaCm - 5 * edad
  return sexo === 'hombre' ? base + 5 : base - 161
}

export const FACTORES: Record<NivelFactor, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muy_alto: 1.9,
}

const NIVELES: NivelFactor[] = ['sedentario', 'ligero', 'moderado', 'alto', 'muy_alto']

const PUNTOS_DIARIOS: Record<ActividadDiaria, number> = { sedentario: 0, ligero: 1, activo: 2 }

const ETIQUETA_DIARIA: Record<ActividadDiaria, string> = {
  sedentario: 'pasas la mayor parte del día sentado',
  ligero: 'pasas parte del día de pie o caminando',
  activo: 'tienes un trabajo físico o caminas mucho',
}

const ETIQUETA_NIVEL: Record<NivelFactor, string> = {
  sedentario: 'sedentario',
  ligero: 'ligero',
  moderado: 'moderado',
  alto: 'alto',
  muy_alto: 'muy alto',
}

function puntosEntrenamiento(dias: number): number {
  if (dias <= 0) return 0
  if (dias <= 3) return 1
  if (dias <= 5) return 2
  return 3
}

export interface ResultadoFactor {
  nivel: NivelFactor
  factor: number
  explicacion: string
}

/**
 * Combina la actividad diaria (sin gym) y los días de entrenamiento en un solo factor.
 * Cada parte suma puntos; el total elige el nivel de la tabla (máximo "muy alto").
 */
export function factorActividad(diaria: ActividadDiaria, diasEntrenamiento: number): ResultadoFactor {
  const dias = Math.max(0, Math.min(7, Math.round(diasEntrenamiento)))
  const indice = Math.min(4, PUNTOS_DIARIOS[diaria] + puntosEntrenamiento(dias))
  const nivel = NIVELES[indice]!
  const factor = FACTORES[nivel]
  const gym = dias === 0 ? 'no entrenas' : `entrenas ${dias} ${dias === 1 ? 'día' : 'días'} por semana`
  return {
    nivel,
    factor,
    explicacion: `Como ${ETIQUETA_DIARIA[diaria]} y ${gym}, usamos el nivel ${ETIQUETA_NIVEL[nivel]} (× ${String(factor).replace('.', ',')}).`,
  }
}

/** Calorías de mantenimiento = basal × factor de actividad. */
export function mantenimiento(basal: number, factor: number): number {
  return Math.round(basal * factor)
}

const VELOCIDADES: Record<Exclude<Objetivo, 'mantener'>, Record<Velocidad, number>> = {
  perder: { lenta: 0.25, recomendada: 0.5, rapida: 0.75 },
  ganar: { lenta: 0.1, recomendada: 0.2, rapida: 0.3 },
}

/** Velocidad sugerida en kg por semana (siempre positiva). */
export function velocidadKgSemana(objetivo: Objetivo, velocidad: Velocidad): number {
  if (objetivo === 'mantener') return 0
  return VELOCIDADES[objetivo][velocidad]
}

/** Ajuste diario de kcal: velocidad × 7.700 / 7 (negativo en déficit). */
export function ajusteCalorico(objetivo: Objetivo, kgSemana: number): number {
  if (objetivo === 'mantener') return 0
  const ajuste = Math.round((kgSemana * KCAL_POR_KG) / 7)
  return objetivo === 'perder' ? -ajuste : ajuste
}

export function kcalObjetivo(kcalMantenimiento: number, objetivo: Objetivo, kgSemana: number): number {
  return kcalMantenimiento + ajusteCalorico(objetivo, kgSemana)
}

/** Rango aceptable del día: ±10 % de la meta. */
export function rangoAceptable(meta: number): { min: number; max: number } {
  return { min: Math.round(meta * 0.9), max: Math.round(meta * 1.1) }
}

/** Agua recomendada: 35 ml por kg, redondeado a 50 ml. */
export function aguaRecomendadaMl(pesoKg: number): number {
  return Math.round((pesoKg * 35) / 50) * 50
}
