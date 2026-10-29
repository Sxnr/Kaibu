// Gráfico de peso (RF-32): puntos del rango elegido, promedio de 7 días, eje y descripción accesible.
import { fechaLarga, formatoNumero, sumarDias } from '../format/formato'
import { promedioMovil7, type PuntoPromedio } from './peso'
import type { RegistroPeso } from './types'

export type RangoGrafico = '2s' | '1m' | '3m' | 'todo'

export const RANGOS: { id: RangoGrafico; texto: string; dias: number | null }[] = [
  { id: '2s', texto: '2 semanas', dias: 14 },
  { id: '1m', texto: '1 mes', dias: 30 },
  { id: '3m', texto: '3 meses', dias: 90 },
  { id: 'todo', texto: 'Todo', dias: null },
]

export interface SerieGrafico {
  puntos: PuntoPromedio[]
  desde: string
  hasta: string
  minKg: number
  maxKg: number
  marcas: number[]
  textoRango: string
}

const PASOS = [0.5, 1, 2, 5, 10, 20]
const MAX_MARCAS = 6

export function serieGrafico(registros: RegistroPeso[], rango: RangoGrafico, hoy: string): SerieGrafico {
  const r = RANGOS.find((x) => x.id === rango)!
  const todos = promedioMovil7(registros)
  const desde = r.dias === null ? (todos[0]?.fecha ?? hoy) : sumarDias(hoy, -(r.dias - 1))
  const puntos = todos.filter((p) => p.fecha >= desde && p.fecha <= hoy)
  const valores = puntos.flatMap((p) => [p.kg, p.promedio])
  const bajo = valores.length ? Math.min(...valores) : 0
  const alto = valores.length ? Math.max(...valores) : 1
  const paso = PASOS.find((s) => (Math.ceil((alto + 0.2) / s) - Math.floor((bajo - 0.2) / s)) <= MAX_MARCAS - 1) ?? 50
  const minKg = Math.floor((bajo - 0.2) / paso) * paso
  const maxKg = Math.ceil((alto + 0.2) / paso) * paso
  const marcas: number[] = []
  for (let v = minKg; v <= maxKg + 1e-9; v += paso) marcas.push(Math.round(v * 10) / 10)
  return { puntos, desde, hasta: hoy, minKg, maxKg, marcas, textoRango: r.texto.toLowerCase() }
}

const kg = (v: number) => `${formatoNumero(v, 1)} kg`

/** Resumen en texto del gráfico para lectores de pantalla. */
export function describirGrafico(s: SerieGrafico): string {
  if (s.puntos.length === 0) return `Sin registros de peso en ${s.textoRango === 'todo' ? 'total' : `las últimas ${s.textoRango}`}.`
  const primero = s.puntos[0]!
  const ultimo = s.puntos.at(-1)!
  const n = s.puntos.length
  const cambio = ultimo.promedio - primero.promedio
  const verbo = Math.abs(cambio) < 0.05 ? 'se mantuvo en' : cambio < 0 ? 'bajó de' : 'subió de'
  const tramo = verbo === 'se mantuvo en' ? kg(ultimo.promedio) : `${kg(primero.promedio)} a ${kg(ultimo.promedio)}`
  return `Peso desde el ${fechaLarga(primero.fecha)} hasta el ${fechaLarga(ultimo.fecha)}, ${n} ${n === 1 ? 'registro' : 'registros'}. El promedio de 7 días ${verbo} ${tramo}.`
}
