import { describe, expect, it } from 'vitest'
import { calcularMacros, proteinaPorDefecto, repartoPorComida, repartoInicial } from './macros'

describe('proteinaPorDefecto', () => {
  it('déficit 2,0 g/kg; mantener y volumen 1,8 g/kg', () => {
    expect(proteinaPorDefecto('perder')).toBe(2.0)
    expect(proteinaPorDefecto('mantener')).toBe(1.8)
    expect(proteinaPorDefecto('ganar')).toBe(1.8)
  })
})

describe('calcularMacros', () => {
  it('proteína y grasas por kg; carbos el resto', () => {
    const m = calcularMacros({ kcal: 2350, pesoKg: 90, objetivo: 'perder' })
    expect(m.proteinaG).toBe(180) // 2,0 × 90
    expect(m.grasasG).toBe(72) // 0,8 × 90
    // (2350 − 180·4 − 72·9) / 4 = 245,5 → 246
    expect(m.carbosG).toBe(246)
  })
  it('acepta proteína editable dentro de 1,6–2,4 g/kg', () => {
    expect(calcularMacros({ kcal: 2500, pesoKg: 80, objetivo: 'ganar', proteinaGKg: 2.2 }).proteinaG).toBe(176)
    expect(() => calcularMacros({ kcal: 2500, pesoKg: 80, objetivo: 'ganar', proteinaGKg: 3 })).toThrow()
  })
  it('grasas nunca bajo 0,6 g/kg', () => {
    expect(calcularMacros({ kcal: 2500, pesoKg: 80, objetivo: 'mantener', grasasGKg: 0.4 }).grasasG).toBe(48)
  })
  it('carbos no son negativos si las kcal no alcanzan', () => {
    const m = calcularMacros({ kcal: 900, pesoKg: 100, objetivo: 'perder' })
    expect(m.carbosG).toBe(0)
    expect(m.carbosInsuficientes).toBe(true)
  })
  it('entrega porcentajes de las kcal', () => {
    const m = calcularMacros({ kcal: 2000, pesoKg: 70, objetivo: 'mantener' })
    expect(m.pct.proteina + m.pct.grasas + m.pct.carbos).toBeGreaterThanOrEqual(99)
    expect(m.pct.proteina + m.pct.grasas + m.pct.carbos).toBeLessThanOrEqual(101)
  })
})

describe('reparto por comida', () => {
  it('4 comidas por defecto: 25 / 35 / 15 / 25', () => {
    expect(repartoInicial(4, false).map((c) => c.pct)).toEqual([25, 35, 15, 25])
    expect(repartoInicial(4, false).map((c) => c.nombre)).toEqual(['Desayuno', 'Almuerzo', 'Once', 'Cena'])
  })
  it('3 comidas por defecto suman 100', () => {
    expect(repartoInicial(3, false).reduce((s, c) => s + c.pct, 0)).toBe(100)
  })
  it('con colaciones sigue sumando 100', () => {
    const r = repartoInicial(4, true)
    expect(r.some((c) => c.id === 'colaciones')).toBe(true)
    expect(r.reduce((s, c) => s + c.pct, 0)).toBe(100)
  })
  it('calcula kcal por comida', () => {
    const r = repartoPorComida(2000, repartoInicial(4, false))
    expect(r.map((c) => c.kcal)).toEqual([500, 700, 300, 500])
  })
  it('rechaza repartos que no suman 100 %', () => {
    expect(() => repartoPorComida(2000, [{ id: 'a', nombre: 'A', pct: 50 }])).toThrow()
  })
})
