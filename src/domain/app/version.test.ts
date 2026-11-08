import { describe, expect, it } from 'vitest'
import { esMasNueva } from './version'

describe('esMasNueva (aviso de APK nuevo)', () => {
  it('detecta una versión mayor', () => {
    expect(esMasNueva('0.2.2-beta', '0.2.1-beta')).toBe(true)
    expect(esMasNueva('0.3.0', '0.2.9')).toBe(true)
    expect(esMasNueva('1.0.0', '0.9.9-beta')).toBe(true)
  })

  it('la versión final es más nueva que su beta, y nunca avisa por la misma versión o una anterior', () => {
    expect(esMasNueva('0.3.0', '0.3.0-beta')).toBe(true)
    expect(esMasNueva('0.3.0-beta', '0.3.0')).toBe(false)
    expect(esMasNueva('0.2.1-beta', '0.2.1-beta')).toBe(false)
    expect(esMasNueva('0.2.0-beta', '0.2.1-beta')).toBe(false)
  })

  it('ignora versiones con formato raro (no avisa)', () => {
    expect(esMasNueva('', '0.2.1-beta')).toBe(false)
    expect(esMasNueva('nueva', '0.2.1-beta')).toBe(false)
    expect(esMasNueva('0.2', '0.2.1')).toBe(false)
  })
})
