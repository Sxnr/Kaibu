import { describe, expect, it } from 'vitest'
import { CATALOGO } from '@/data/catalogo'
import { validarCoherenciaKcal } from '../calc/dia'
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

describe('catálogo inicial', () => {
  it('tiene alrededor de 100 alimentos con id único', () => {
    expect(CATALOGO.length).toBeGreaterThanOrEqual(100)
    expect(new Set(CATALOGO.map((a) => a.id)).size).toBe(CATALOGO.length)
  })
  it('cada alimento indica su fuente y una porción típica', () => {
    for (const a of CATALOGO) {
      expect(a.fuente.length, a.id).toBeGreaterThan(5)
      expect(a.porcion.g, a.id).toBeGreaterThan(0)
    }
  })
  it('kcal coherentes con 4·P + 4·C + 9·G (la fibra explica diferencias menores)', () => {
    for (const a of CATALOGO) {
      const calculadas = a.proteina * 4 + a.carbos * 4 + a.grasas * 9
      const tolerancia = Math.max(a.kcal * 0.2, 10)
      expect(Math.abs(calculadas - a.kcal), `${a.id}: ${a.kcal} vs ${calculadas}`).toBeLessThanOrEqual(tolerancia)
    }
  })
  it('la mayoría pasa la validación estricta de ±15 %', () => {
    const ok = CATALOGO.filter((a) => validarCoherenciaKcal(a)).length
    expect(ok / CATALOGO.length).toBeGreaterThan(0.85)
  })
})
