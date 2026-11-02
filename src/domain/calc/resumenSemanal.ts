// Resumen de la semana o del mes (RF-33): días que cumplió kcal y proteína, y promedios.
import { diasDeSemana, formatoNumero } from '../format/formato'
import { estadoDia } from './dia'

/** La proteína del día cuenta como cumplida desde el 90 % de la meta. */
export const PROTEINA_CUMPLIDA = 0.9

export type Periodo = 'semana' | 'mes'

export interface DiaNutricion {
  fecha: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  /** Cantidad de comidas anotadas ese día. */
  registros: number
}

export interface ResumenPeriodo {
  /** Días del período que ya pasaron (incluye hoy). */
  diasTranscurridos: number
  diasConRegistro: number
  diasKcal: number
  diasProteina: number
  diasAmbos: number
  promedio: { kcal: number; proteina: number; carbos: number; grasas: number } | null
}

/** Fechas del período: la semana de lunes a domingo, o el mes calendario completo. */
export function diasDelPeriodo(periodo: Periodo, hoy: string): string[] {
  if (periodo === 'semana') return diasDeSemana(hoy)
  const [anio, mes] = hoy.split('-').map(Number) as [number, number]
  const total = new Date(anio, mes, 0).getDate()
  const prefijo = hoy.slice(0, 8)
  return Array.from({ length: total }, (_, i) => `${prefijo}${String(i + 1).padStart(2, '0')}`)
}

/** Recibe un día por cada fecha del período; los posteriores a hoy no cuentan. */
export function resumenPeriodo(dias: DiaNutricion[], metas: { kcal: number; proteina: number }, hoy: string): ResumenPeriodo {
  const pasados = dias.filter((d) => d.fecha <= hoy)
  const conRegistro = pasados.filter((d) => d.registros > 0)
  let diasKcal = 0
  let diasProteina = 0
  let diasAmbos = 0
  for (const d of conRegistro) {
    const kcal = estadoDia({ kcal: d.kcal, meta: metas.kcal, registros: d.registros }) === 'cumplido'
    const proteina = metas.proteina > 0 && d.proteina >= metas.proteina * PROTEINA_CUMPLIDA
    if (kcal) diasKcal++
    if (proteina) diasProteina++
    if (kcal && proteina) diasAmbos++
  }
  const media = (campo: 'kcal' | 'proteina' | 'carbos' | 'grasas') =>
    Math.round(conRegistro.reduce((s, d) => s + d[campo], 0) / conRegistro.length)
  return {
    diasTranscurridos: pasados.length,
    diasConRegistro: conRegistro.length,
    diasKcal,
    diasProteina,
    diasAmbos,
    promedio: conRegistro.length ? { kcal: media('kcal'), proteina: media('proteina'), carbos: media('carbos'), grasas: media('grasas') } : null,
  }
}

/** Texto para lectores de pantalla y para el resumen escrito. */
export function describirResumen(r: ResumenPeriodo, periodo: Periodo): string {
  const cuando = periodo === 'semana' ? 'Esta semana' : 'Este mes'
  if (!r.promedio) return `${cuando} todavía no tienes comidas anotadas.`
  const de = `de ${r.diasTranscurridos} ${r.diasTranscurridos === 1 ? 'día' : 'días'}`
  return (
    `${cuando} cumpliste tus kcal ${r.diasKcal} ${de} y tu proteína ${r.diasProteina} ${de}. ` +
    `Promedio: ${formatoNumero(r.promedio.kcal)} kcal y ${formatoNumero(r.promedio.proteina)} g de proteína al día.`
  )
}
