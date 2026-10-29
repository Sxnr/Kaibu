import { describe, expect, it } from 'vitest'
import { describirGrafico, serieGrafico } from './grafico'

const registros = [
  { fecha: '2026-09-01', kg: 74 },
  { fecha: '2026-10-20', kg: 70.6 },
  { fecha: '2026-10-25', kg: 70.2 },
  { fecha: '2026-10-28', kg: 69.9 },
]

describe('serieGrafico', () => {
  it('filtra por rango e incluye el promedio de 7 días', () => {
    const s = serieGrafico(registros, '2s', '2026-10-28')
    expect(s.puntos.map((p) => p.fecha)).toEqual(['2026-10-20', '2026-10-25', '2026-10-28'])
    expect(s.puntos.at(-1)!.promedio).toBeCloseTo(70.05, 2)
    expect(s.desde).toBe('2026-10-15')
  })

  it('"todo" usa desde el primer registro', () => {
    const s = serieGrafico(registros, 'todo', '2026-10-28')
    expect(s.puntos).toHaveLength(4)
    expect(s.desde).toBe('2026-09-01')
  })

  it('el eje deja margen y marcas redondas', () => {
    const s = serieGrafico(registros, '2s', '2026-10-28')
    expect(s.minKg).toBeLessThanOrEqual(69.9)
    expect(s.maxKg).toBeGreaterThanOrEqual(70.6)
    expect(s.marcas.length).toBeGreaterThanOrEqual(2)
    s.marcas.forEach((m) => expect(Math.round(m * 2)).toBe(m * 2))
  })

  it('sin datos en el rango devuelve una serie vacía', () => {
    expect(serieGrafico([], '1m', '2026-10-28').puntos).toEqual([])
  })
})

describe('describirGrafico', () => {
  it('resume la serie para lector de pantalla', () => {
    const texto = describirGrafico(serieGrafico(registros, '2s', '2026-10-28'))
    expect(texto).toContain('3 registros')
    expect(texto).toContain('70,6')
    expect(texto).toMatch(/70,[01] kg/)
  })
  it('explica cuando no hay registros', () => {
    expect(describirGrafico(serieGrafico([], '2s', '2026-10-28'))).toContain('Sin registros')
  })
})
