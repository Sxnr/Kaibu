// Preparaciones calculadas desde una receta típica: se suman los ingredientes y se llevan a 100 g del plato terminado.
import type { Nutrientes } from '../calc/dia'

export interface Ingrediente {
  /** Valores del ingrediente por 100 g. */
  por100: Nutrientes
  gramos: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Valores por 100 g del plato terminado (el agua de cocción o la merma solo cambian el peso final). */
export function nutrientesDeReceta(ingredientes: readonly Ingrediente[], gramosFinales: number): Nutrientes {
  if (!(gramosFinales > 0)) throw new Error('El peso final de la receta debe ser mayor que 0')
  const total = (campo: keyof Nutrientes) => ingredientes.reduce((s, i) => s + (i.por100[campo] * i.gramos) / 100, 0)
  const f = 100 / gramosFinales
  return {
    kcal: Math.round(total('kcal') * f),
    proteina: r1(total('proteina') * f),
    carbos: r1(total('carbos') * f),
    grasas: r1(total('grasas') * f),
  }
}
