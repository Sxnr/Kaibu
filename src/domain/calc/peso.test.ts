import { describe, expect, it } from 'vitest'
import { avanceFase, promedioMovil7, proyeccionLlegada, ritmoReal, semanasDeDatos } from './peso'
import type { RegistroPeso } from './types'

const serie = (inicio: string, valores: number[]): RegistroPeso[] => {
  const [a, m, d] = inicio.split('-').map(Number) as [number, number, number]
  return valores.map((kg, i) => {
    const f = new Date(a, m - 1, d + i)
    const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
    return { fecha: iso, kg }
  })
}

describe('promedioMovil7', () => {
  it('promedia los registros de los últimos 7 días calendario', () => {
    const r = promedioMovil7(serie('2026-10-01', [90, 92, 91]))
    expect(r.map((p) => p.promedio)).toEqual([90, 91, 91])
  })
  it('ignora registros fuera de la ventana de 7 días', () => {
    const datos = [
      { fecha: '2026-10-01', kg: 100 },
      { fecha: '2026-10-09', kg: 90 },
    ]
    expect(promedioMovil7(datos).at(-1)?.promedio).toBe(90)
  })
  it('ordena por fecha aunque lleguen desordenados', () => {
    const r = promedioMovil7([
      { fecha: '2026-10-02', kg: 92 },
      { fecha: '2026-10-01', kg: 90 },
    ])
    expect(r[0]?.fecha).toBe('2026-10-01')
  })
  it('lista vacía = sin datos', () => {
    expect(promedioMovil7([])).toEqual([])
  })
})

describe('ritmoReal', () => {
  it('diferencia entre el promedio de la última semana y la anterior', () => {
    const datos = serie('2026-10-01', [92, 92, 92, 92, 92, 92, 92, 91.5, 91.5, 91.5, 91.5, 91.5, 91.5, 91.5])
    expect(ritmoReal(datos, '2026-10-14')).toBeCloseTo(-0.5)
  })
  it('null si falta una de las dos semanas', () => {
    expect(ritmoReal(serie('2026-10-10', [92, 91]), '2026-10-11')).toBeNull()
  })
})

describe('semanasDeDatos', () => {
  it('cuenta semanas entre el primer y el último registro', () => {
    expect(semanasDeDatos(serie('2026-10-01', new Array(15).fill(90)))).toBe(2)
    expect(semanasDeDatos([])).toBe(0)
  })
})

describe('proyeccionLlegada', () => {
  it('usa el ritmo planeado con menos de 2 semanas de datos', () => {
    const r = proyeccionLlegada({
      pesoActual: 91,
      pesoMeta: 83,
      ritmoReal: -2,
      ritmoPlaneado: 0.5,
      objetivo: 'perder',
      semanasDatos: 1,
      hoy: '2026-10-24',
    })
    expect(r?.basadoEn).toBe('planeado')
    expect(r?.semanas).toBe(16)
    expect(r?.fecha).toBe('2027-02-13')
  })
  it('usa el ritmo real con 2 semanas o más', () => {
    const r = proyeccionLlegada({
      pesoActual: 91,
      pesoMeta: 83,
      ritmoReal: -1,
      ritmoPlaneado: 0.5,
      objetivo: 'perder',
      semanasDatos: 3,
      hoy: '2026-10-24',
    })
    expect(r?.basadoEn).toBe('real')
    expect(r?.semanas).toBe(8)
  })
  it('null si el ritmo real va en dirección contraria', () => {
    expect(
      proyeccionLlegada({
        pesoActual: 91,
        pesoMeta: 83,
        ritmoReal: 0.3,
        ritmoPlaneado: 0.5,
        objetivo: 'perder',
        semanasDatos: 3,
        hoy: '2026-10-24',
      }),
    ).toBeNull()
  })
  it('meta ya alcanzada = 0 semanas', () => {
    const r = proyeccionLlegada({
      pesoActual: 82.9,
      pesoMeta: 83,
      ritmoReal: null,
      ritmoPlaneado: 0.5,
      objetivo: 'perder',
      semanasDatos: 0,
      hoy: '2026-10-24',
    })
    expect(r?.semanas).toBe(0)
  })
})

describe('avanceFase', () => {
  it('porcentaje logrado entre inicio y meta', () => {
    expect(avanceFase(95, 91, 83)).toBeCloseTo(33.3, 1)
    expect(avanceFase(70, 72, 75)).toBe(40)
  })
  it('se limita entre 0 y 100', () => {
    expect(avanceFase(95, 97, 83)).toBe(0)
    expect(avanceFase(95, 80, 83)).toBe(100)
  })
  it('mantener (inicio = meta) = 100', () => {
    expect(avanceFase(80, 80, 80)).toBe(100)
  })
})
