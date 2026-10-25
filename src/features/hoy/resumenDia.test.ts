import { describe, expect, it } from 'vitest'
import type { RegistroComida } from '@/data/db'
import { repartoInicial } from '@/domain/calc/macros'
import { estadosPorFecha, rachaActual, resumenPorComida } from './resumenDia'

const r = (fecha: string, comida: string, kcal: number): RegistroComida => ({
  id: `${fecha}-${comida}-${kcal}`,
  userId: 'u',
  fecha,
  comida,
  nombre: 'x',
  origen: 'rapido',
  alimentoClave: null,
  gramos: null,
  cantidad: 1,
  unidad: 'porción',
  kcal,
  proteina: 10,
  carbos: 0,
  grasas: 0,
  createdAt: '',
  updatedAt: '',
  deletedAt: null,
})

describe('resumen del día', () => {
  it('suma por comida configurada', () => {
    const res = resumenPorComida([r('2026-10-25', 'desayuno', 300), r('2026-10-25', 'desayuno', 200)], repartoInicial(4, false))
    expect(res[0]?.total.kcal).toBe(500)
    expect(res[1]?.total.kcal).toBe(0)
  })
  it('agrupa registros de comidas que ya no existen en "Otras"', () => {
    const res = resumenPorComida([r('2026-10-25', 'once', 300)], repartoInicial(3, false))
    expect(res.at(-1)?.nombre).toBe('Otras')
  })
  it('estados y racha por fecha', () => {
    const regs = [r('2026-10-23', 'almuerzo', 2000), r('2026-10-24', 'almuerzo', 1950), r('2026-10-22', 'almuerzo', 3000)]
    expect(estadosPorFecha(regs, 2000)).toEqual({ '2026-10-23': 'cumplido', '2026-10-24': 'cumplido', '2026-10-22': 'fuera' })
    expect(rachaActual(regs, 2000, '2026-10-25')).toBe(2)
  })
})
