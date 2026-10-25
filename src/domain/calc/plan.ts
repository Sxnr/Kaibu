// Plan completo del usuario: une todos los cálculos y explica de dónde sale cada número.
import { formatoNumero } from '../format/formato'
import { avisosSeguridad, type AvisoSeguridad } from './ajustes'
import {
  aguaRecomendadaMl,
  ajusteCalorico,
  calcularEdad,
  factorActividad,
  kcalObjetivo,
  mantenimiento,
  metabolismoBasal,
  rangoAceptable,
  velocidadKgSemana,
} from './energia'
import { calcularMacros, repartoPorComida, type ComidaConKcal } from './macros'
import type { ActividadDiaria, ComidaReparto, NivelFactor, Objetivo, Sexo, Velocidad } from './types'

export interface PerfilParaPlan {
  sexo: Sexo
  fechaNacimiento: string
  estaturaCm: number
  /** Peso de referencia: promedio de 7 días si existe, si no el último registrado. */
  pesoKg: number
  actividad: ActividadDiaria
  diasEntrenamiento: number
  objetivo: Objetivo
  velocidad: Velocidad
  comidas: ComidaReparto[]
  /** Ajustes manuales opcionales. */
  proteinaGKg?: number
  kcalManual?: number | null
}

export interface PlanCalculado {
  edad: number
  basal: number
  nivel: NivelFactor
  factor: number
  mantenimiento: number
  kgSemana: number
  ajuste: number
  kcal: number
  rango: { min: number; max: number }
  proteinaG: number
  grasasG: number
  carbosG: number
  pct: { proteina: number; carbos: number; grasas: number }
  proteinaGKg: number
  grasasGKg: number
  carbosInsuficientes: boolean
  aguaMl: number
  comidas: ComidaConKcal[]
  avisos: AvisoSeguridad[]
  explicaciones: Record<'basal' | 'mantenimiento' | 'kcal' | 'rango' | 'proteina' | 'grasas' | 'carbos' | 'agua' | 'comidas', string>
}

const n = (v: number, d = 0) => formatoNumero(v, d)

export function calcularPlan(p: PerfilParaPlan, hoy: Date = new Date()): PlanCalculado {
  const edad = calcularEdad(p.fechaNacimiento, hoy)
  const basal = metabolismoBasal({ sexo: p.sexo, pesoKg: p.pesoKg, estaturaCm: p.estaturaCm, edad })
  const fa = factorActividad(p.actividad, p.diasEntrenamiento)
  const mant = mantenimiento(basal, fa.factor)
  const kgSemana = velocidadKgSemana(p.objetivo, p.velocidad)
  const ajuste = ajusteCalorico(p.objetivo, kgSemana)
  const kcalCalculada = kcalObjetivo(mant, p.objetivo, kgSemana)
  const kcal = p.kcalManual && p.kcalManual > 0 ? Math.round(p.kcalManual) : kcalCalculada
  const rango = rangoAceptable(kcal)
  const m = calcularMacros({ kcal, pesoKg: p.pesoKg, objetivo: p.objetivo, proteinaGKg: p.proteinaGKg })
  const aguaMl = aguaRecomendadaMl(p.pesoKg)
  const comidas = repartoPorComida(kcal, p.comidas)
  const avisos = avisosSeguridad({ sexo: p.sexo, kcalObjetivo: kcal, ritmoKgSemana: kgSemana, pesoKg: p.pesoKg })

  const textoAjuste =
    p.objetivo === 'mantener'
      ? 'Como tu objetivo es mantener, la meta es igual a tu mantenimiento.'
      : `${p.objetivo === 'perder' ? 'Restamos' : 'Sumamos'} ${n(Math.abs(ajuste))} kcal al día para ${
          p.objetivo === 'perder' ? 'bajar' : 'subir'
        } ${n(kgSemana, 2).replace(/,?0+$/, '')} kg por semana (1 kg ≈ 7.700 kcal).`

  return {
    edad,
    basal: Math.round(basal),
    nivel: fa.nivel,
    factor: fa.factor,
    mantenimiento: mant,
    kgSemana,
    ajuste,
    kcal,
    rango,
    ...m,
    aguaMl,
    comidas,
    avisos,
    explicaciones: {
      basal: `Lo que gasta tu cuerpo en reposo según tu peso, estatura, edad y sexo (fórmula Mifflin-St Jeor): ${n(basal)} kcal.`,
      mantenimiento: `${fa.explicacion} ${n(basal)} × ${String(fa.factor).replace('.', ',')} = ${n(mant)} kcal.`,
      kcal: p.kcalManual ? 'Meta ajustada a mano por ti.' : textoAjuste,
      rango: 'Un día cuenta como cumplido si quedas entre −10 % y +10 % de tu meta.',
      proteina: `${String(m.proteinaGKg).replace('.', ',')} g por kg de peso, para cuidar y construir músculo.`,
      grasas: `${String(m.grasasGKg).replace('.', ',')} g por kg de peso, necesarias para tus hormonas.`,
      carbos: 'Las calorías que quedan después de la proteína y las grasas (4 kcal por gramo).',
      agua: '35 ml por kg de peso. Puedes ajustarla a tu gusto.',
      comidas: 'Tus kcal del día repartidas según el porcentaje de cada comida.',
    },
  }
}
