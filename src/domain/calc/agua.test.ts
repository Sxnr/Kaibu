import { describe, expect, it } from 'vitest'
import { AGUA_MAX_ML, avanceAgua, restarVaso, sumarVaso, vasoValido } from './agua'

describe('agua (RF-25)', () => {
  it('suma y resta un vaso', () => {
    expect(sumarVaso(500, 250)).toBe(750)
    expect(restarVaso(500, 250)).toBe(250)
  })

  it('nunca baja de 0 ni pasa del máximo', () => {
    expect(restarVaso(100, 250)).toBe(0)
    expect(sumarVaso(9900, 250)).toBe(AGUA_MAX_ML)
  })

  it('el vaso va de 100 a 1.000 ml', () => {
    expect(vasoValido(250)).toBe(true)
    expect(vasoValido(99)).toBe(false)
    expect(vasoValido(1001)).toBe(false)
    expect(vasoValido(250.5)).toBe(false)
  })

  it('calcula el avance hacia la meta', () => {
    expect(avanceAgua(1250, 2450)).toEqual({ porcentaje: 51, cumplida: false, faltanMl: 1200 })
    expect(avanceAgua(3000, 2450)).toEqual({ porcentaje: 100, cumplida: true, faltanMl: 0 })
    expect(avanceAgua(0, 0)).toEqual({ porcentaje: 0, cumplida: false, faltanMl: 0 })
  })
})
