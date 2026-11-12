import { describe, expect, it } from 'vitest'
import { debeOfrecerApk, leerDescarteApk } from './ofrecerApk'

const base = {
  sistema: 'android' as const,
  esApp: false,
  descartadaEl: null,
  hoy: '2026-11-12',
}

describe('debeOfrecerApk', () => {
  it('se ofrece en la web de un Android que no tiene la app', () => {
    expect(debeOfrecerApk(base)).toBe(true)
  })
  it('no se ofrece dentro de la app, en iPhone ni en computador', () => {
    expect(debeOfrecerApk({ ...base, esApp: true })).toBe(false)
    expect(debeOfrecerApk({ ...base, sistema: 'ios' })).toBe(false)
    expect(debeOfrecerApk({ ...base, sistema: 'otro' })).toBe(false)
  })
  it('"Ahora no" lo esconde 30 días', () => {
    expect(debeOfrecerApk({ ...base, descartadaEl: '2026-11-01' })).toBe(false)
    expect(debeOfrecerApk({ ...base, descartadaEl: '2026-10-13' })).toBe(true)
  })
})

describe('leerDescarteApk', () => {
  it('acepta solo fechas válidas', () => {
    expect(leerDescarteApk('2026-11-01')).toBe('2026-11-01')
    expect(leerDescarteApk('basura')).toBeNull()
    expect(leerDescarteApk(null)).toBeNull()
  })
})
