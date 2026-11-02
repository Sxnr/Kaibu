import { describe, expect, it } from 'vitest'
import { documentosCambiados } from './legal'

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
