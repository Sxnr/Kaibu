import { describe, expect, it } from 'vitest'
import { datosPublicacion } from './publicarSemana'

const resumen = { diasTranscurridos: 4, diasConRegistro: 4, diasKcal: 3, diasProteina: 2, diasAmbos: 2, promedio: null }

describe('publicar mi semana en el Discord', () => {
  it('manda los números del período y la racha, sin peso por defecto', () => {
    expect(datosPublicacion({ resumen, periodo: 'semana', racha: 12, objetivo: 'perder', kgAvanzados: 2.44, pesoKg: 68.46, mostrarPeso: false })).toEqual({
      p_periodo: 'semana',
      p_dias_anotados: 4,
      p_dias_total: 4,
      p_dias_kcal: 3,
      p_dias_proteina: 2,
      p_racha: 12,
      p_kg_avanzados: -2.4,
      p_peso_kg: null,
    })
  })

  it('el peso solo va si la persona lo activa', () => {
    const d = datosPublicacion({ resumen, periodo: 'mes', racha: 0, objetivo: 'ganar', kgAvanzados: 1.26, pesoKg: 70.04, mostrarPeso: true })
    expect(d.p_peso_kg).toBe(70)
    expect(d.p_kg_avanzados).toBe(1.3)
  })

  it('sin avance (o en mantener) no manda kilos, igual que la imagen', () => {
    expect(datosPublicacion({ resumen, periodo: 'semana', racha: 1, objetivo: 'mantener', kgAvanzados: 3, pesoKg: null, mostrarPeso: true }).p_kg_avanzados).toBeNull()
    expect(datosPublicacion({ resumen, periodo: 'semana', racha: 1, objetivo: 'perder', kgAvanzados: 0, pesoKg: null, mostrarPeso: false }).p_kg_avanzados).toBeNull()
  })

  it('nunca manda 0 días de total (la base lo rechazaría)', () => {
    expect(datosPublicacion({ resumen: { ...resumen, diasTranscurridos: 0, diasConRegistro: 0, diasKcal: 0, diasProteina: 0 }, periodo: 'semana', racha: 0, objetivo: 'perder', kgAvanzados: 0, pesoKg: null, mostrarPeso: false }).p_dias_total).toBe(1)
  })
})
