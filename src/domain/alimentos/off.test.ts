import { describe, expect, it } from 'vitest'
import { productoDesdeOff } from './off'

const base = {
  code: '7802920010212',
  product_name_es: 'Yoghurt Protein Plus!',
  brands: 'Colun, Otra',
  serving_size: '150 g',
  serving_quantity: 150,
  nutriments: { 'energy-kcal_100g': 80, proteins_100g: 7.4, carbohydrates_100g: 11.9, fat_100g: 0.3 },
}

describe('productos de Open Food Facts', () => {
  it('toma los valores por 100 g, la primera marca y la porción', () => {
    expect(productoDesdeOff(base)).toMatchObject({
      id: 'off-7802920010212',
      nombre: 'Yoghurt Protein Plus!',
      marca: 'Colun',
      kcal: 80,
      proteina: 7.4,
      carbos: 11.9,
      grasas: 0.3,
      porcion: { nombre: '150 g', g: 150 },
    })
  })

  it('si solo trae valores por porción, los pasa a 100 g (antes esos productos se perdían)', () => {
    const p = productoDesdeOff({
      ...base,
      nutriments: { 'energy-kcal_serving': 114, proteins_serving: 10.1, carbohydrates_serving: 12.3, fat_serving: 2.7 },
      serving_quantity: 140,
    })
    expect(p).toMatchObject({ kcal: 81, proteina: 7.2, carbos: 8.8, grasas: 1.9 })
  })

  it('descarta datos incoherentes o incompletos', () => {
    expect(productoDesdeOff({ ...base, nutriments: { ...base.nutriments, 'energy-kcal_100g': 500 } })).toBeNull()
    expect(productoDesdeOff({ ...base, brands: '' })).toBeNull()
    expect(productoDesdeOff({ ...base, code: '123' })).toBeNull()
    expect(productoDesdeOff({ ...base, nutriments: { proteins_100g: 7 } })).toBeNull()
    expect(productoDesdeOff({ ...base, nutriments: { ...base.nutriments, proteins_100g: 70, carbohydrates_100g: 40 } })).toBeNull()
  })

  it('usa el nombre en español si existe y limpia espacios', () => {
    expect(productoDesdeOff({ ...base, product_name_es: '', product_name: '  Leche   Proteína  ' })?.nombre).toBe('Leche Proteína')
  })
})
