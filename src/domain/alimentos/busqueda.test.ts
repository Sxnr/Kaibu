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
