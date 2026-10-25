import { describe, expect, it } from 'vitest'
import {
  ajusteCalorico,
  aguaRecomendadaMl,
  calcularEdad,
  factorActividad,
  kcalObjetivo,
  mantenimiento,
  metabolismoBasal,
  rangoAceptable,
  velocidadKgSemana,
} from './energia'

describe('calcularEdad', () => {
  it('cuenta años cumplidos', () => {
    expect(calcularEdad('1990-10-24', new Date(2026, 9, 24))).toBe(36)
    expect(calcularEdad('1990-10-25', new Date(2026, 9, 24))).toBe(35)
  })
})

describe('metabolismoBasal (Mifflin-St Jeor)', () => {
  it('hombre: 10·peso + 6,25·estatura − 5·edad + 5', () => {
    expect(metabolismoBasal({ sexo: 'hombre', pesoKg: 90, estaturaCm: 178, edad: 30 })).toBeCloseTo(1867.5)
  })
  it('mujer: 10·peso + 6,25·estatura − 5·edad − 161', () => {
    expect(metabolismoBasal({ sexo: 'mujer', pesoKg: 65, estaturaCm: 165, edad: 28 })).toBeCloseTo(1380.25)
  })
  it('rechaza datos imposibles', () => {
    expect(() => metabolismoBasal({ sexo: 'hombre', pesoKg: 0, estaturaCm: 178, edad: 30 })).toThrow()
  })
})

describe('factorActividad', () => {
  it('sedentario sin gym = 1,2', () => {
    expect(factorActividad('sedentario', 0).factor).toBe(1.2)
  })
  it('sedentario + 3 días = ligero 1,375', () => {
    expect(factorActividad('sedentario', 3)).toMatchObject({ nivel: 'ligero', factor: 1.375 })
  })
  it('sedentario + 5 días = moderado 1,55', () => {
    expect(factorActividad('sedentario', 5).factor).toBe(1.55)
  })
  it('ligero + 6 días = muy alto 1,9 (tope)', () => {
    expect(factorActividad('ligero', 6).factor).toBe(1.9)
  })
  it('activo + 7 días no supera 1,9', () => {
    expect(factorActividad('activo', 7).factor).toBe(1.9)
  })
  it('incluye una explicación para el usuario', () => {
    expect(factorActividad('sedentario', 3).explicacion).toMatch(/3 días/)
  })
})

describe('mantenimiento y objetivo', () => {
  it('mantenimiento = basal × factor, redondeado', () => {
    expect(mantenimiento(1867.5, 1.55)).toBe(2895)
  })
  it('velocidades sugeridas', () => {
    expect(velocidadKgSemana('perder', 'recomendada')).toBe(0.5)
    expect(velocidadKgSemana('perder', 'rapida')).toBe(0.75)
    expect(velocidadKgSemana('ganar', 'lenta')).toBe(0.1)
    expect(velocidadKgSemana('ganar', 'rapida')).toBe(0.3)
    expect(velocidadKgSemana('mantener', 'rapida')).toBe(0)
  })
  it('ajuste = velocidad × 7.700 / 7 (negativo en déficit)', () => {
    expect(ajusteCalorico('perder', 0.5)).toBe(-550)
    expect(ajusteCalorico('ganar', 0.2)).toBe(220)
    expect(ajusteCalorico('mantener', 0)).toBe(0)
  })
  it('kcal objetivo = mantenimiento ± ajuste', () => {
    expect(kcalObjetivo(2895, 'perder', 0.5)).toBe(2345)
    expect(kcalObjetivo(2500, 'ganar', 0.2)).toBe(2720)
  })
  it('rango aceptable ±10 %', () => {
    expect(rangoAceptable(2350)).toEqual({ min: 2115, max: 2585 })
  })
})

describe('aguaRecomendadaMl', () => {
  it('35 ml por kg, redondeado a 50 ml', () => {
    expect(aguaRecomendadaMl(91.1)).toBe(3200)
    expect(aguaRecomendadaMl(60)).toBe(2100)
  })
})
