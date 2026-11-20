import { describe, expect, it } from 'vitest'
import { cambioMedidas, dimensionesFoto, validarMedidas, validarSuplemento } from './seguimiento'

describe('suplementos', () => {
  it('pide nombre y valida dosis, hora y kcal', () => {
    expect(validarSuplemento({ nombre: '', dosis: '', hora: '25:00', kcal: -1, proteina: 0 })).toEqual({
      nombre: 'Ponle un nombre',
      hora: 'Hora no válida',
      kcal: 'Entre 0 y 2.000 kcal',
    })
    expect(validarSuplemento({ nombre: 'Whey', dosis: '1 scoop (30 g)', hora: '18:30', kcal: 120, proteina: 24 })).toEqual({})
    expect(validarSuplemento({ nombre: 'Creatina', dosis: 'x'.repeat(41), hora: '', kcal: 0, proteina: 0 })).toEqual({ dosis: 'Máximo 40 letras' })
  })
})

describe('medidas', () => {
  it('acepta solo valores entre 10 y 250 cm y al menos una medida', () => {
    expect(validarMedidas({ cintura: null, pecho: null, brazo: null, muslo: null })).toEqual({ general: 'Anota al menos una medida' })
    expect(validarMedidas({ cintura: 5, pecho: 300, brazo: 35, muslo: null })).toEqual({ cintura: 'Entre 10 y 250 cm', pecho: 'Entre 10 y 250 cm' })
    expect(validarMedidas({ cintura: 82, pecho: null, brazo: null, muslo: null })).toEqual({})
  })
  it('calcula el cambio desde la primera medida', () => {
    const lista = [
      { fecha: '2026-11-01', cintura: 86, pecho: 100, brazo: null, muslo: null },
      { fecha: '2026-11-15', cintura: 84.5, pecho: null, brazo: 35, muslo: null },
      { fecha: '2026-11-20', cintura: 83, pecho: 99, brazo: null, muslo: null },
    ]
    expect(cambioMedidas(lista)).toEqual({ cintura: -3, pecho: -1, brazo: null, muslo: null })
    expect(cambioMedidas([])).toEqual({ cintura: null, pecho: null, brazo: null, muslo: null })
  })
})

describe('fotos de progreso', () => {
  it('achica a un máximo de 1080 px por lado, sin agrandar', () => {
    expect(dimensionesFoto(4000, 3000)).toEqual({ ancho: 1080, alto: 810 })
    expect(dimensionesFoto(3000, 4000)).toEqual({ ancho: 810, alto: 1080 })
    expect(dimensionesFoto(800, 600)).toEqual({ ancho: 800, alto: 600 })
  })
})
