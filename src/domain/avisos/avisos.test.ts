import { describe, expect, it } from 'vitest'
import { PREFERENCIAS_INICIALES, enSilencio, leerPreferencias, planificarAvisos, type EstadoAvisos, type PreferenciasAvisos } from './avisos'

const activas: PreferenciasAvisos = { ...PREFERENCIAS_INICIALES, activos: true }
const comidas = [
  { id: 'desayuno', nombre: 'Desayuno' },
  { id: 'almuerzo', nombre: 'Almuerzo' },
  { id: 'once', nombre: 'Once' },
  { id: 'cena', nombre: 'Cena' },
]
// Viernes 20 a las 12:00.
const base: EstadoAvisos = {
  hoy: '2026-11-20',
  horaActual: '12:00',
  comidas,
  comidasPorFecha: { '2026-11-20': new Set(['desayuno']) },
  kcalHoy: 400,
  kcalMinima: 1263,
  ultimoDiaConRegistro: '2026-11-20',
  aguaHoyMl: 500,
  aguaMetaMl: 2450,
  suplementos: [{ id: 's1', nombre: 'Creatina', hora: '13:00', tomadoHoy: false }],
}
const de = (avisos: ReturnType<typeof planificarAvisos>, fecha: string) => avisos.filter((a) => a.fecha === fecha)

describe('planificarAvisos', () => {
  it('apagados por defecto: sin permiso no se programa nada', () => {
    expect(PREFERENCIAS_INICIALES.activos).toBe(false)
    expect(planificarAvisos(PREFERENCIAS_INICIALES, base)).toEqual([])
  })

  it('hoy solo avisa de las comidas que faltan y cuya hora no pasó', () => {
    const hoy = de(planificarAvisos(activas, base), '2026-11-20').filter((a) => a.tipo === 'comida')
    // Desayuno ya anotado; almuerzo 14:00, once 18:00 y cena 21:00 aún no.
    expect(hoy.map((a) => [a.hora, a.titulo])).toEqual([
      ['14:00', '¿Ya anotaste tu almuerzo?'],
      ['18:00', '¿Ya anotaste tu once?'],
      ['21:00', '¿Ya anotaste tu cena?'],
    ])
  })

  it('lo planificado cuenta como anotado (meal prep)', () => {
    const estado = { ...base, comidasPorFecha: { ...base.comidasPorFecha, '2026-11-21': new Set(['almuerzo']) } }
    const manana = de(planificarAvisos(activas, estado), '2026-11-21').filter((a) => a.tipo === 'comida')
    expect(manana.map((a) => a.ref)).toEqual(['desayuno', 'once', 'cena'])
  })

  it('al final del día avisa cuánto falta, y no si ya llegó a la meta', () => {
    const fin = planificarAvisos(activas, base).find((a) => a.tipo === 'fin_dia' && a.fecha === '2026-11-20')
    expect(fin).toMatchObject({ hora: '20:30', titulo: 'Se te está acabando el día' })
    expect(fin?.cuerpo).toContain('863 kcal')
    const cumplido = planificarAvisos(activas, { ...base, kcalHoy: 1300 }).find((a) => a.tipo === 'fin_dia' && a.fecha === '2026-11-20')
    expect(cumplido).toBeUndefined()
  })

  it('si deja de anotar, avisa a los 2, 4 y 7 días (una sola vez cada uno)', () => {
    const inactivo = planificarAvisos(activas, base).filter((a) => a.tipo === 'inactividad')
    expect(inactivo.map((a) => [a.fecha, a.hora])).toEqual([
      ['2026-11-22', '19:00'],
      ['2026-11-24', '19:00'],
      ['2026-11-27', '19:00'],
    ])
    expect(inactivo[0]?.titulo).toBe('Llevas 2 días sin anotar')
  })

  it('suplementos a su hora si no se tomaron, y agua si falta', () => {
    const hoy = de(planificarAvisos(activas, base), '2026-11-20')
    expect(hoy.find((a) => a.tipo === 'suplemento')).toMatchObject({ hora: '13:00', titulo: 'Hora de tu creatina' })
    expect(hoy.filter((a) => a.tipo === 'agua').map((a) => a.hora)).toEqual(['16:00'])
    const tomado = planificarAvisos(activas, { ...base, suplementos: [{ ...base.suplementos[0]!, tomadoHoy: true }] })
    expect(de(tomado, '2026-11-20').some((a) => a.tipo === 'suplemento')).toBe(false)
  })

  it('respeta cada tipo apagado y el horario de silencio', () => {
    const sinComidas = planificarAvisos({ ...activas, comidas: false }, base)
    expect(sinComidas.some((a) => a.tipo === 'comida')).toBe(false)
    // Silencio desde las 20:00: la cena (21:00) y el fin del día (20:30) no suenan.
    const silencio = planificarAvisos({ ...activas, silencioDesde: '20:00', silencioHasta: '08:00' }, base)
    expect(silencio.some((a) => a.hora >= '20:00')).toBe(false)
  })

  it('cada aviso tiene un número único y estable', () => {
    const a = planificarAvisos(activas, base)
    const b = planificarAvisos(activas, base)
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
    expect(new Set(a.map((x) => x.id)).size).toBe(a.length)
    expect(a.every((x) => Number.isInteger(x.id) && x.id > 0 && x.id < 2 ** 31)).toBe(true)
  })
})

describe('silencio y preferencias guardadas', () => {
  it('el silencio puede cruzar la medianoche', () => {
    expect(enSilencio('23:30', '22:00', '08:00')).toBe(true)
    expect(enSilencio('07:59', '22:00', '08:00')).toBe(true)
    expect(enSilencio('08:00', '22:00', '08:00')).toBe(false)
    expect(enSilencio('14:00', '13:00', '15:00')).toBe(true)
  })
  it('lee lo guardado y descarta lo raro', () => {
    expect(leerPreferencias(null)).toEqual(PREFERENCIAS_INICIALES)
    expect(leerPreferencias('basura')).toEqual(PREFERENCIAS_INICIALES)
    expect(leerPreferencias(JSON.stringify({ activos: true, agua: false, silencioDesde: '25:00' }))).toEqual({ ...PREFERENCIAS_INICIALES, activos: true, agua: false })
  })
})
