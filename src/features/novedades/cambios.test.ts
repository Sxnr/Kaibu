import { describe, expect, it } from 'vitest'
import { CAMBIOS, EN_CAMINO, debeAvisarNovedades, versionLegible } from './cambios'

describe('novedades', () => {
  it('la versión más reciente es la del package.json (__VERSION__ al compilar)', () => {
    expect(CAMBIOS[0]!.version).toBe(__VERSION__)
  })

  it('cada versión tiene fecha y al menos un cambio', () => {
    for (const v of CAMBIOS) {
      expect(v.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(v.cambios.length).toBeGreaterThan(0)
    }
    expect(EN_CAMINO.length).toBeGreaterThan(0)
  })

  it('muestra la versión de forma legible', () => {
    expect(versionLegible('0.2.0-beta')).toBe('0.2.0 · beta')
    expect(versionLegible('1.0.0')).toBe('1.0.0')
  })

  it('avisa una sola vez cuando la app se actualiza, nunca en la primera vez', () => {
    expect(debeAvisarNovedades(null, '0.2.0-beta')).toBe(false)
    expect(debeAvisarNovedades('0.1.0', '0.2.0-beta')).toBe(true)
    expect(debeAvisarNovedades('0.2.0-beta', '0.2.0-beta')).toBe(false)
  })
})
