import { describe, expect, it } from 'vitest'
import { avisosSeguridad, metaAlcanzada, planTransicion, sugerenciaSemanal } from './ajustes'

describe('sugerenciaSemanal (déficit)', () => {
  it('baja menos de la mitad de lo planeado 2 semanas → −150 kcal', () => {
    const s = sugerenciaSemanal({ objetivo: 'perder', ritmoPlaneado: 0.5, cambiosSemanales: [-0.1, -0.2], pesoKg: 90 })
    expect(s).toMatchObject({ deltaKcal: -150 })
  })
  it('una sola semana lenta no basta', () => {
    expect(sugerenciaSemanal({ objetivo: 'perder', ritmoPlaneado: 0.5, cambiosSemanales: [-0.1], pesoKg: 90 })).toBeNull()
  })
  it('baja más de 1 % del peso → +150 kcal', () => {
    const s = sugerenciaSemanal({ objetivo: 'perder', ritmoPlaneado: 0.5, cambiosSemanales: [-0.5, -1.0], pesoKg: 90 })
    expect(s?.deltaKcal).toBe(150)
  })
  it('baja más de 1,5 % del peso → +200 kcal', () => {
    const s = sugerenciaSemanal({ objetivo: 'perder', ritmoPlaneado: 0.5, cambiosSemanales: [-0.5, -1.5], pesoKg: 90 })
    expect(s?.deltaKcal).toBe(200)
  })
  it('ritmo dentro de lo esperado → sin sugerencia', () => {
    expect(sugerenciaSemanal({ objetivo: 'perder', ritmoPlaneado: 0.5, cambiosSemanales: [-0.4, -0.5], pesoKg: 90 })).toBeNull()
  })
})

describe('sugerenciaSemanal (volumen)', () => {
  it('sube menos de la mitad de lo planeado 2 semanas → +150 kcal', () => {
    const s = sugerenciaSemanal({ objetivo: 'ganar', ritmoPlaneado: 0.2, cambiosSemanales: [0.05, 0], pesoKg: 75 })
    expect(s?.deltaKcal).toBe(150)
  })
  it('sube más de 1 % del peso → −150 kcal', () => {
    const s = sugerenciaSemanal({ objetivo: 'ganar', ritmoPlaneado: 0.2, cambiosSemanales: [0.2, 0.9], pesoKg: 75 })
    expect(s?.deltaKcal).toBe(-150)
  })
  it('mantener no sugiere nada', () => {
    expect(sugerenciaSemanal({ objetivo: 'mantener', ritmoPlaneado: 0, cambiosSemanales: [1, 1], pesoKg: 75 })).toBeNull()
  })
})

describe('avisosSeguridad', () => {
  it('hombre bajo 1.500 kcal', () => {
    expect(avisosSeguridad({ sexo: 'hombre', kcalObjetivo: 1450, ritmoKgSemana: 0.5, pesoKg: 90 })).toContain('kcal_bajo_minimo')
  })
  it('mujer bajo 1.200 kcal', () => {
    expect(avisosSeguridad({ sexo: 'mujer', kcalObjetivo: 1300, ritmoKgSemana: 0.25, pesoKg: 60 })).toEqual([])
    expect(avisosSeguridad({ sexo: 'mujer', kcalObjetivo: 1150, ritmoKgSemana: 0.25, pesoKg: 60 })).toContain('kcal_bajo_minimo')
  })
  it('ritmo sobre 1 % del peso por semana', () => {
    expect(avisosSeguridad({ sexo: 'mujer', kcalObjetivo: 1500, ritmoKgSemana: 0.75, pesoKg: 60 })).toContain('ritmo_alto')
  })
})

describe('metaAlcanzada', () => {
  it('déficit: promedio igual o bajo la meta', () => {
    expect(metaAlcanzada('perder', 82.9, 83)).toBe(true)
    expect(metaAlcanzada('perder', 83.5, 83)).toBe(false)
  })
  it('volumen: promedio igual o sobre la meta', () => {
    expect(metaAlcanzada('ganar', 80, 80)).toBe(true)
  })
  it('mantener nunca "llega"', () => {
    expect(metaAlcanzada('mantener', 80, 80)).toBe(false)
  })
})

describe('planTransicion', () => {
  it('sube gradualmente hasta el destino, máximo 150 kcal por semana', () => {
    expect(planTransicion(2000, 2400)).toEqual([2150, 2300, 2400])
  })
  it('respeta un paso mínimo de 100 kcal', () => {
    expect(planTransicion(2000, 2050)).toEqual([2050])
  })
  it('sin cambios si ya está en el destino', () => {
    expect(planTransicion(2400, 2400)).toEqual([])
  })
})
