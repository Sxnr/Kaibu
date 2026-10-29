import { describe, expect, it } from 'vitest'
import { ajusteVigente, claveRevision, debeMostrarAjuste, esDiaDeRevision, pasosTransicion, semanaISO, type EventoUsuario } from './semana'

const ev = (e: Partial<EventoUsuario> & Pick<EventoUsuario, 'tipo' | 'clave'>): EventoUsuario => ({
  valor: null,
  fecha: '2026-10-26',
  ...e,
})

describe('semanaISO', () => {
  it('numera la semana ISO (lunes a domingo)', () => {
    expect(semanaISO('2026-10-26')).toBe('2026-W44') // lunes
    expect(semanaISO('2026-11-01')).toBe('2026-W44') // domingo
    expect(semanaISO('2026-11-02')).toBe('2026-W45')
  })
  it('respeta el cambio de año ISO', () => {
    expect(semanaISO('2027-01-01')).toBe('2026-W53')
    expect(semanaISO('2026-01-01')).toBe('2026-W01')
  })
})

describe('esDiaDeRevision y claveRevision', () => {
  it('el ajuste se revisa el domingo y, si no se vio, el lunes', () => {
    expect(esDiaDeRevision('2026-11-01')).toBe(true) // domingo
    expect(esDiaDeRevision('2026-11-02')).toBe(true) // lunes
    expect(esDiaDeRevision('2026-11-03')).toBe(false)
  })
  it('el lunes revisa la semana que terminó el domingo', () => {
    expect(claveRevision('2026-11-01')).toBe('2026-W44')
    expect(claveRevision('2026-11-02')).toBe('2026-W44')
  })
})

describe('debeMostrarAjuste', () => {
  const sugerencia = { deltaKcal: -150, motivo: 'x' }
  it('se muestra el día de revisión si hay sugerencia y no se respondió', () => {
    expect(debeMostrarAjuste({ hoy: '2026-11-01', sugerencia, eventos: [] })).toBe(true)
  })
  it('no se muestra sin sugerencia ni fuera del día de revisión', () => {
    expect(debeMostrarAjuste({ hoy: '2026-11-01', sugerencia: null, eventos: [] })).toBe(false)
    expect(debeMostrarAjuste({ hoy: '2026-11-04', sugerencia, eventos: [] })).toBe(false)
  })
  it('no se repite si ya se aceptó o rechazó esa semana', () => {
    const eventos = [ev({ tipo: 'ajuste_semanal', clave: '2026-W44', valor: 'rechazado' })]
    expect(debeMostrarAjuste({ hoy: '2026-11-02', sugerencia, eventos })).toBe(false)
  })
})

describe('ajusteVigente', () => {
  it('suma los ajustes aceptados que ya rigen', () => {
    const eventos = [
      ev({ tipo: 'ajuste_semanal', clave: '2026-W43', valor: '-150', fecha: '2026-10-26' }),
      ev({ tipo: 'ajuste_semanal', clave: '2026-W44', valor: '-150', fecha: '2026-11-02' }),
    ]
    expect(ajusteVigente(eventos, '2026-11-01', null)).toBe(-150)
    expect(ajusteVigente(eventos, '2026-11-02', null)).toBe(-300)
  })
  it('ignora los rechazados, otros tipos y los de una fase anterior', () => {
    const eventos = [
      ev({ tipo: 'ajuste_semanal', clave: '2026-W40', valor: '-150', fecha: '2026-10-01' }),
      ev({ tipo: 'ajuste_semanal', clave: '2026-W43', valor: 'rechazado', fecha: '2026-10-26' }),
      ev({ tipo: 'dia_terminado', clave: '2026-10-26', valor: '200', fecha: '2026-10-26' }),
    ]
    expect(ajusteVigente(eventos, '2026-11-02', '2026-10-15')).toBe(0)
  })
  it('cuenta los pasos de transición desde el inicio de la fase nueva', () => {
    const eventos = [
      ev({ tipo: 'ajuste_semanal', clave: 'transicion:2026-11-02:0', valor: '-450', fecha: '2026-11-02' }),
      ev({ tipo: 'ajuste_semanal', clave: 'transicion:2026-11-02:1', valor: '150', fecha: '2026-11-09' }),
    ]
    expect(ajusteVigente(eventos, '2026-11-02', '2026-11-02')).toBe(-450)
    expect(ajusteVigente(eventos, '2026-11-09', '2026-11-02')).toBe(-300)
  })
})

describe('pasosTransicion', () => {
  it('parte en las kcal actuales y sube de a 150 por semana hasta el destino', () => {
    const p = pasosTransicion(1900, 2300, '2026-11-02')
    expect(p).toEqual([
      { clave: 'transicion:2026-11-02:0', valor: -400, fecha: '2026-11-02' },
      { clave: 'transicion:2026-11-02:1', valor: 150, fecha: '2026-11-09' },
      { clave: 'transicion:2026-11-02:2', valor: 150, fecha: '2026-11-16' },
      { clave: 'transicion:2026-11-02:3', valor: 100, fecha: '2026-11-23' },
    ])
    expect(p.reduce((s, x) => s + x.valor, 0)).toBe(0)
  })
  it('no hace nada si el destino no es mayor', () => {
    expect(pasosTransicion(2300, 2300, '2026-11-02')).toEqual([])
  })
  it('limita el primer paso a 1.500 kcal', () => {
    expect(pasosTransicion(1500, 3300, '2026-11-02')[0]!.valor).toBe(-1500)
  })
})
