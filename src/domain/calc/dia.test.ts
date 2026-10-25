import { describe, expect, it } from 'vitest'
import { calcularRacha, estadoDia, nutrientesPorGramos, validarCoherenciaKcal } from './dia'

describe('estadoDia', () => {
  it('sin registros', () => {
    expect(estadoDia({ kcal: 0, meta: 2000, registros: 0 })).toBe('sin_registro')
  })
  it('cumplido dentro de ±10 %', () => {
    expect(estadoDia({ kcal: 1850, meta: 2000, registros: 3 })).toBe('cumplido')
    expect(estadoDia({ kcal: 2200, meta: 2000, registros: 3 })).toBe('cumplido')
  })
  it('fuera de rango', () => {
    expect(estadoDia({ kcal: 2300, meta: 2000, registros: 3 })).toBe('fuera')
  })
})

describe('calcularRacha', () => {
  it('cuenta días cumplidos consecutivos hasta ayer, más hoy si ya cumple', () => {
    const estados = {
      '2026-10-20': 'cumplido',
      '2026-10-21': 'cumplido',
      '2026-10-22': 'fuera',
      '2026-10-23': 'cumplido',
    } as const
    expect(calcularRacha(estados, '2026-10-24')).toBe(1)
    expect(calcularRacha({ ...estados, '2026-10-24': 'cumplido' }, '2026-10-24')).toBe(2)
  })
  it('hoy sin cumplir no rompe la racha', () => {
    expect(calcularRacha({ '2026-10-23': 'cumplido' }, '2026-10-24')).toBe(1)
  })
  it('sin datos = 0', () => {
    expect(calcularRacha({}, '2026-10-24')).toBe(0)
  })
})

describe('nutrientesPorGramos', () => {
  it('escala valores por 100 g', () => {
    expect(nutrientesPorGramos({ kcal: 250, proteina: 10, carbos: 30, grasas: 10 }, 150)).toEqual({
      kcal: 375,
      proteina: 15,
      carbos: 45,
      grasas: 15,
    })
  })
})

describe('validarCoherenciaKcal', () => {
  it('kcal ≈ 4P + 4C + 9G con margen ±15 %', () => {
    expect(validarCoherenciaKcal({ kcal: 100, proteina: 10, carbos: 10, grasas: 2.2 })).toBe(true)
    expect(validarCoherenciaKcal({ kcal: 300, proteina: 10, carbos: 10, grasas: 2.2 })).toBe(false)
  })
})
