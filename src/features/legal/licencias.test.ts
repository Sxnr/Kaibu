import { describe, expect, it } from 'vitest'
import licencias from './licencias.json'

describe('licencias de terceros (RF-48)', () => {
  it('incluye las dependencias principales con su licencia', () => {
    expect(licencias.find((l) => l.nombre === 'react')?.licencia).toBe('MIT')
    expect(licencias.find((l) => l.nombre === 'three')?.licencia).toBe('MIT')
  })

  it('ninguna dependencia de producción queda sin licencia declarada', () => {
    expect(licencias.filter((l) => l.licencia === 'Sin licencia declarada')).toEqual([])
  })
})
