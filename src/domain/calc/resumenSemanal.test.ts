import { describe, expect, it } from 'vitest'
import { describirResumen, diasDelPeriodo, PROTEINA_CUMPLIDA, resumenPeriodo, type DiaNutricion } from './resumenSemanal'

const dia = (fecha: string, kcal: number, proteina: number, registros = 3): DiaNutricion => ({
  fecha,
  kcal,
  proteina,
  carbos: 200,
  grasas: 60,
  registros,
})
const metas = { kcal: 2000, proteina: 150 }

describe('días del período', () => {
  it('la semana va de lunes a domingo', () => {
    const d = diasDelPeriodo('semana', '2026-11-04')
    expect(d[0]).toBe('2026-11-02')
    expect(d).toHaveLength(7)
  })

  it('el mes es el mes calendario completo', () => {
    const d = diasDelPeriodo('mes', '2026-11-04')
    expect(d[0]).toBe('2026-11-01')
    expect(d.at(-1)).toBe('2026-11-30')
  })
})

describe('resumen del período (RF-33)', () => {
  it('la proteína se cumple desde el 90 % de la meta', () => {
    expect(PROTEINA_CUMPLIDA).toBe(0.9)
    const r = resumenPeriodo([dia('2026-11-02', 2000, 135), dia('2026-11-03', 2000, 134)], metas, '2026-11-03')
    expect(r.diasProteina).toBe(1)
  })

  it('cuenta los días con kcal en rango, proteína cumplida y ambos', () => {
    const r = resumenPeriodo(
      [dia('2026-11-02', 2000, 150), dia('2026-11-03', 2500, 150), dia('2026-11-04', 1950, 100), dia('2026-11-05', 0, 0, 0)],
      metas,
      '2026-11-05',
    )
    expect(r).toMatchObject({ diasTranscurridos: 4, diasConRegistro: 3, diasKcal: 2, diasProteina: 2, diasAmbos: 1 })
  })

  it('no cuenta los días futuros', () => {
    const r = resumenPeriodo([dia('2026-11-02', 2000, 150), dia('2026-11-08', 2000, 150)], metas, '2026-11-04')
    expect(r.diasTranscurridos).toBe(1)
    expect(r.diasKcal).toBe(1)
  })

  it('promedia solo los días con registros', () => {
    const r = resumenPeriodo([dia('2026-11-02', 1800, 140), dia('2026-11-03', 2200, 160), dia('2026-11-04', 0, 0, 0)], metas, '2026-11-04')
    expect(r.promedio).toEqual({ kcal: 2000, proteina: 150, carbos: 200, grasas: 60 })
  })

  it('sin registros no hay promedio', () => {
    const r = resumenPeriodo([], metas, '2026-11-04')
    expect(r.promedio).toBeNull()
    expect(r.diasConRegistro).toBe(0)
  })

  it('lo describe en palabras', () => {
    const r = resumenPeriodo([dia('2026-11-02', 2000, 150), dia('2026-11-03', 2500, 120)], metas, '2026-11-03')
    expect(describirResumen(r, 'semana')).toBe(
      'Esta semana cumpliste tus kcal 1 de 2 días y tu proteína 1 de 2 días. Promedio: 2.250 kcal y 135 g de proteína al día.',
    )
    expect(describirResumen(resumenPeriodo([], metas, '2026-11-03'), 'mes')).toBe('Este mes todavía no tienes comidas anotadas.')
  })
})
