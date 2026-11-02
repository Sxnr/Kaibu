import { describe, expect, it } from 'vitest'
import { nutrientesDeReceta } from './recetas'

const arroz = { kcal: 130, proteina: 2.7, carbos: 28, grasas: 0.3 }
const pollo = { kcal: 165, proteina: 31, carbos: 0, grasas: 3.6 }
const aceite = { kcal: 884, proteina: 0, carbos: 0, grasas: 100 }

describe('nutrientes de una receta (valor por 100 g del plato terminado)', () => {
  it('suma los ingredientes y los lleva a 100 g', () => {
    const r = nutrientesDeReceta(
      [
        { por100: arroz, gramos: 200 },
        { por100: pollo, gramos: 100 },
      ],
      300,
    )
    expect(r).toEqual({ kcal: 142, proteina: 12.1, carbos: 18.7, grasas: 1.4 })
  })

  it('el agua o la merma cambian el peso final, no los nutrientes totales', () => {
    // 100 g de arroz + 15 g de aceite en una sopa de 500 g.
    const r = nutrientesDeReceta(
      [
        { por100: arroz, gramos: 100 },
        { por100: aceite, gramos: 15 },
      ],
      500,
    )
    expect(r.kcal).toBe(Math.round((130 + 132.6) / 5))
    expect(r.grasas).toBe(3.1)
  })

  it('rechaza un peso final imposible', () => {
    expect(() => nutrientesDeReceta([{ por100: arroz, gramos: 100 }], 0)).toThrow()
  })
})
