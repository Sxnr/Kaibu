import { describe, expect, it } from 'vitest'
import { CATALOGO } from '@/data/catalogo'
import { buscarAlimentos, normalizar } from './busqueda'

describe('normalizar', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar('  Plátano  Mediano ')).toBe('platano mediano')
  })
})

describe('buscarAlimentos', () => {
  it('encuentra sin tildes y por sinónimo', () => {
    expect(buscarAlimentos(CATALOGO, 'platano')[0]?.id).toBe('platano')
    expect(buscarAlimentos(CATALOGO, 'aguacate')[0]?.id).toBe('palta')
    expect(buscarAlimentos(CATALOGO, 'pan batido')[0]?.id).toBe('marraqueta')
  })
  it('prioriza coincidencias al inicio del nombre', () => {
    expect(buscarAlimentos(CATALOGO, 'huevo')[0]?.id).toBe('huevo')
  })
  it('consulta vacía no devuelve nada', () => {
    expect(buscarAlimentos(CATALOGO, '   ')).toEqual([])
  })
})

describe('buscador con sinónimos, plurales y marca', () => {
  const lista = [
    { id: 'yp', nombre: 'Yoghurt Protein Plus! sabor Frutilla', marca: 'Colun', alias: [] },
    { id: 'lp', nombre: 'Leche Semidescremada Protein+ Power', marca: 'Soprole', alias: [] },
    { id: 'gj', nombre: 'Goodness Jalea Protein', marca: 'Nestlé', alias: [] },
    { id: 'hu', nombre: 'Huevo duro', marca: undefined, alias: [] },
    { id: 'fr', nombre: 'Frijoles negros cocidos', marca: undefined, alias: [] },
    { id: 'ar', nombre: 'Arepa de maíz', marca: undefined, alias: [] },
  ]
  const ids = (q: string) => buscarAlimentos(lista, q).map((a) => a.id)

  it('yogur / yogurt / yoghurt y proteína / protein son lo mismo', () => {
    expect(ids('yogur proteina')).toContain('yp')
    expect(ids('yogurt proteico')).toContain('yp')
    expect(ids('leche proteina')).toEqual(['lp'])
  })

  it('el plural encuentra el singular', () => {
    expect(ids('huevos duros')).toEqual(['hu'])
  })

  it('sinónimos latinoamericanos (porotos = frijoles = caraotas, choclo = maíz, frutilla = fresa)', () => {
    expect(ids('porotos negros')).toEqual(['fr'])
    expect(ids('caraotas')).toEqual(['fr'])
    expect(ids('arepa de choclo')).toEqual(['ar'])
    expect(ids('yogur fresa')).toEqual(['yp'])
  })

  it('marca + producto pone primero ese producto', () => {
    expect(ids('nestle goodness')[0]).toBe('gj')
    expect(ids('soprole protein')[0]).toBe('lp')
  })

  it('escribir a medias sigue funcionando', () => {
    expect(ids('yog')).toContain('yp')
  })
})
