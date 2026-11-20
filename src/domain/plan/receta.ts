// Meal prep: una preparación en lote dividida en porciones (lógica pura).
import type { Nutrientes } from '../calc/dia'

export interface Ingrediente extends Nutrientes {
  /** Clave del alimento de origen ("catalogo:arroz", "mio:<id>"…). */
  clave: string
  nombre: string
  /** Gramos que se usan en la preparación completa. Los nutrientes son por 100 g. */
  gramos: number
}

export interface ResultadoReceta {
  totalG: number
  porcionG: number
  por100: Nutrientes
  porPorcion: Nutrientes
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Suma los ingredientes y divide en porciones. */
export function calcularReceta(ingredientes: readonly Ingrediente[], porciones: number): ResultadoReceta {
  const totalG = ingredientes.reduce((s, i) => s + i.gramos, 0)
  const total = (k: keyof Nutrientes) => ingredientes.reduce((s, i) => s + (i[k] * i.gramos) / 100, 0)
  const nut = (div: number): Nutrientes => ({
    kcal: Math.round(total('kcal') / div),
    proteina: r1(total('proteina') / div),
    carbos: r1(total('carbos') / div),
    grasas: r1(total('grasas') / div),
  })
  const por100 = totalG > 0 ? { kcal: r1((total('kcal') * 100) / totalG), proteina: r1((total('proteina') * 100) / totalG), carbos: r1((total('carbos') * 100) / totalG), grasas: r1((total('grasas') * 100) / totalG) } : { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  return { totalG, porcionG: porciones > 0 ? r1(totalG / porciones) : 0, por100, porPorcion: porciones > 0 ? nut(porciones) : nut(1) }
}

export interface DatosReceta {
  nombre: string
  porciones: number
  ingredientes: readonly Ingrediente[]
}

export type ErroresReceta = Partial<Record<'nombre' | 'porciones' | 'ingredientes', string>>

export const MAX_INGREDIENTES = 40

export function validarReceta({ nombre, porciones, ingredientes }: DatosReceta): ErroresReceta {
  const e: ErroresReceta = {}
  if (!nombre.trim()) e.nombre = 'Ponle un nombre'
  else if (nombre.trim().length > 120) e.nombre = 'Máximo 120 letras'
  if (!Number.isFinite(porciones) || porciones < 1 || porciones > 100) e.porciones = 'Entre 1 y 100 porciones'
  if (ingredientes.length === 0) e.ingredientes = 'Agrega al menos un ingrediente'
  else if (ingredientes.length > MAX_INGREDIENTES) e.ingredientes = `Máximo ${MAX_INGREDIENTES} ingredientes`
  else if (ingredientes.some((i) => !Number.isFinite(i.gramos) || i.gramos < 1 || i.gramos > 10_000)) e.ingredientes = 'Cada ingrediente necesita sus gramos (entre 1 y 10.000)'
  return e
}
