import { describe, expect, it } from 'vitest'
import { repartoInicial } from './macros'
import { calcularPlan } from './plan'

const base = {
  sexo: 'hombre' as const,
  fechaNacimiento: '1996-05-10',
  estaturaCm: 178,
  pesoKg: 90,
  actividad: 'sedentario' as const,
  diasEntrenamiento: 4,
  objetivo: 'perder' as const,
  velocidad: 'recomendada' as const,
  comidas: repartoInicial(4, false),
}

describe('calcularPlan', () => {
  const hoy = new Date(2026, 9, 24)

  it('une basal, mantenimiento, meta, macros y reparto', () => {
    const p = calcularPlan(base, hoy)
    expect(p.edad).toBe(30)
    expect(p.basal).toBe(1868) // 900 + 1112,5 − 150 + 5 = 1867,5
    expect(p.factor).toBe(1.55)
    expect(p.mantenimiento).toBe(2895)
    expect(p.kcal).toBe(2345)
    expect(p.rango).toEqual({ min: 2111, max: 2580 })
    expect(p.proteinaG).toBe(180)
    expect(p.comidas.reduce((s, c) => s + c.kcal, 0)).toBeCloseTo(2345, -1)
    expect(p.aguaMl).toBe(3150)
    expect(p.avisos).toEqual([])
  })

  it('respeta la meta manual', () => {
    expect(calcularPlan({ ...base, kcalManual: 2200 }, hoy).kcal).toBe(2200)
  })

  it('suma los ajustes semanales aceptados y lo explica', () => {
    const p = calcularPlan({ ...base, ajusteKcal: -150 }, hoy)
    expect(p.kcal).toBe(2195)
    expect(p.explicaciones.kcal).toContain('150')
  })

  it('la meta manual manda sobre el ajuste semanal', () => {
    expect(calcularPlan({ ...base, kcalManual: 2200, ajusteKcal: -150 }, hoy).kcal).toBe(2200)
  })

  it('avisa si la meta queda bajo el mínimo', () => {
    const p = calcularPlan({ ...base, kcalManual: 1400 }, hoy)
    expect(p.avisos).toContain('kcal_bajo_minimo')
  })

  it('explica cada valor', () => {
    const p = calcularPlan(base, hoy)
    expect(p.explicaciones.kcal).toContain('550')
    expect(p.explicaciones.mantenimiento).toContain('1,55')
  })
})
