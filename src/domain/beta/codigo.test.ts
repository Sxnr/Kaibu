import { describe, expect, it } from 'vitest'
import { accesoBeta, codigoConFormato, normalizarCodigo } from './codigo'

describe('código de beta', () => {
  it('normaliza lo que la persona escribe o pega (minúsculas, espacios y guiones)', () => {
    expect(normalizarCodigo(' abcd-2345 ')).toBe('ABCD2345')
    expect(normalizarCodigo('ab cd 23 45')).toBe('ABCD2345')
  })

  it('revisa el formato antes de preguntar al servidor (8 caracteres, sin I, O, 0 ni 1)', () => {
    expect(codigoConFormato('ABCD2345')).toBe(true)
    expect(codigoConFormato('abcd-2345')).toBe(true)
    expect(codigoConFormato('ABCD234')).toBe(false)
    expect(codigoConFormato('ABCD2340')).toBe(false)
    expect(codigoConFormato('IOIO1111')).toBe(false)
  })
})

describe('acceso a la app con la beta cerrada', () => {
  it('con la beta abierta entra cualquiera', () => {
    expect(accesoBeta({ cerrada: false, tieneAcceso: false })).toBe('si')
  })
  it('con la beta cerrada solo entra quien tiene acceso', () => {
    expect(accesoBeta({ cerrada: true, tieneAcceso: true })).toBe('si')
    expect(accesoBeta({ cerrada: true, tieneAcceso: false })).toBe('no')
  })
  it('mientras no se sabe, espera (no bloquea ni deja pasar a ciegas)', () => {
    expect(accesoBeta({ cerrada: null, tieneAcceso: true })).toBe('cargando')
    expect(accesoBeta({ cerrada: true, tieneAcceso: null })).toBe('cargando')
  })
})
