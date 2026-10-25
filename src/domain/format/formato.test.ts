import { describe, expect, it } from 'vitest'
import {
  diasDeSemana,
  fechaCorta,
  fechaLarga,
  formatoNumero,
  hoyISO,
  inicioSemana,
  parseDecimal,
  sumarDias,
} from './formato'

describe('formatoNumero (Chile)', () => {
  it('punto de miles y coma decimal', () => {
    expect(formatoNumero(2350)).toBe('2.350')
    expect(formatoNumero(91.1, 1)).toBe('91,1')
    expect(formatoNumero(1234567.891, 2)).toBe('1.234.567,89')
    expect(formatoNumero(-1240)).toBe('−1.240')
    expect(formatoNumero(0.5, 1)).toBe('0,5')
  })
})

describe('parseDecimal', () => {
  it('acepta coma o punto', () => {
    expect(parseDecimal('91,1')).toBe(91.1)
    expect(parseDecimal('91.1')).toBe(91.1)
    expect(parseDecimal(' 80 ')).toBe(80)
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('')).toBeNull()
  })
})

describe('fechas', () => {
  it('fecha larga en español', () => {
    expect(fechaLarga('2026-10-24')).toBe('sábado 24 de octubre')
  })
  it('fecha corta', () => {
    expect(fechaCorta('2026-10-24')).toBe('24 oct')
  })
  it('semana de lunes a domingo', () => {
    expect(inicioSemana('2026-10-24')).toBe('2026-10-19')
    expect(inicioSemana('2026-10-19')).toBe('2026-10-19')
    expect(inicioSemana('2026-10-25')).toBe('2026-10-19')
    expect(diasDeSemana('2026-10-24')).toHaveLength(7)
    expect(diasDeSemana('2026-10-24')[6]).toBe('2026-10-25')
  })
  it('sumar días cruzando meses', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('hoy en zona horaria local', () => {
    expect(hoyISO(new Date(2026, 9, 24, 23, 59))).toBe('2026-10-24')
  })
})
