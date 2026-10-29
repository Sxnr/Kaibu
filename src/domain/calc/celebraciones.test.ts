import { describe, expect, it } from 'vitest'
import { avisosPendientes, claveAviso, logrosAlTerminar } from './celebraciones'

describe('logrosAlTerminar', () => {
  const base = {
    hoy: '2026-11-01',
    cumplido: true,
    racha: 1,
    kgAvanzados: 0,
    metaAlcanzada: false,
    faseInicio: '2026-10-01',
    celebrados: new Set<string>(),
  }

  it('celebra el día cumplido una vez por día', () => {
    expect(logrosAlTerminar(base).map((l) => l.clave)).toEqual(['dia:2026-11-01'])
    expect(logrosAlTerminar({ ...base, celebrados: new Set(['dia:2026-11-01']) })).toEqual([])
  })

  it('no celebra un día fuera de rango', () => {
    expect(logrosAlTerminar({ ...base, cumplido: false })).toEqual([])
  })

  it('celebra la racha al llegar a 3, 7, 14 o 30 días, una vez por racha', () => {
    const r = logrosAlTerminar({ ...base, racha: 7 })
    expect(r.map((l) => l.clave)).toContain('racha:7:2026-10-26')
    expect(logrosAlTerminar({ ...base, racha: 8 }).some((l) => l.clave.startsWith('racha'))).toBe(false)
  })

  it('celebra cada kilo de avance de la fase, una vez', () => {
    const r = logrosAlTerminar({ ...base, kgAvanzados: 2.3 })
    expect(r.map((l) => l.clave)).toContain('kg:2:2026-10-01')
    expect(logrosAlTerminar({ ...base, kgAvanzados: 2.3, celebrados: new Set(['kg:2:2026-10-01']) }).some((l) => l.clave.startsWith('kg'))).toBe(false)
  })

  it('celebra la meta de la fase y la pone primero', () => {
    const r = logrosAlTerminar({ ...base, metaAlcanzada: true, racha: 3 })
    expect(r[0]!.clave).toBe('meta:2026-10-01')
  })
})

describe('avisosPendientes', () => {
  it('muestra cada aviso una sola vez por fase', () => {
    const vistos = new Set([claveAviso('ritmo_alto', '2026-10-01')])
    expect(avisosPendientes(['kcal_bajo_minimo', 'ritmo_alto'], vistos, '2026-10-01')).toEqual(['kcal_bajo_minimo'])
    expect(avisosPendientes(['ritmo_alto'], vistos, '2026-12-01')).toEqual(['ritmo_alto'])
  })
})
