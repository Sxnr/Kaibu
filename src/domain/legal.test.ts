import { describe, expect, it } from 'vitest'
import { documentosCambiados, VERSION_DATOS_SALUD, VERSION_PRIVACIDAD, VERSION_SALUD, VERSIONES_VIGENTES } from './legal'

const vigentes = { terminos: '2026-11-02', datos_salud: '2026-11-02' }

describe('aviso de documentos que cambiaron (RF-48)', () => {
  it('no avisa si aceptó las versiones vigentes', () => {
    const aceptados = [
      { tipo: 'terminos' as const, version: '2026-11-02' },
      { tipo: 'datos_salud' as const, version: '2026-11-02' },
    ]
    expect(documentosCambiados(aceptados, vigentes)).toEqual([])
  })

  it('avisa los documentos con una versión nueva', () => {
    const aceptados = [
      { tipo: 'terminos' as const, version: '2026-10-25' },
      { tipo: 'datos_salud' as const, version: '2026-11-02' },
    ]
    expect(documentosCambiados(aceptados, vigentes)).toEqual(['terminos'])
  })

  it('toma la aceptación más reciente', () => {
    const aceptados = [
      { tipo: 'terminos' as const, version: '2026-10-25' },
      { tipo: 'terminos' as const, version: '2026-11-02' },
      { tipo: 'datos_salud' as const, version: '2026-11-02' },
    ]
    expect(documentosCambiados(aceptados, vigentes)).toEqual([])
  })

  it('sin aceptaciones guardadas no avisa (se piden al crear la cuenta)', () => {
    expect(documentosCambiados([], vigentes)).toEqual([])
  })
})

describe('versiones vigentes', () => {
  it('el consentimiento de salud sigue la versión más nueva entre Privacidad y Aviso de salud', () => {
    expect(VERSION_DATOS_SALUD).toBe(VERSION_PRIVACIDAD > VERSION_SALUD ? VERSION_PRIVACIDAD : VERSION_SALUD)
    expect(VERSIONES_VIGENTES.datos_salud).toBe(VERSION_DATOS_SALUD)
  })

  it('Términos y Privacidad tienen la versión del Sprint 2', () => {
    expect(VERSIONES_VIGENTES.terminos).toBe('2026-11-02')
    expect(VERSION_PRIVACIDAD).toBe('2026-11-05')
  })
})
