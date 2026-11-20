import { describe, expect, it } from 'vitest'
import { calendarioMes, enRangoPlan, FECHA_MAX_DIAS, mesSiguiente, mesAnterior } from './calendario'
import { calcularReceta, validarReceta } from './receta'
import { diasParaRepartir, fechasRepetidas } from './repartir'
import { listaCompras } from './compras'

const arroz = { clave: 'catalogo:arroz', nombre: 'Arroz blanco cocido', gramos: 1000, kcal: 130, proteina: 2.7, carbos: 28, grasas: 0.3 }
const pollo = { clave: 'catalogo:pollo', nombre: 'Pechuga de pollo cocida', gramos: 1200, kcal: 165, proteina: 31, carbos: 0, grasas: 3.6 }

describe('calendario', () => {
  it('se puede planificar hasta 8 semanas hacia adelante y cualquier día pasado', () => {
    expect(FECHA_MAX_DIAS).toBe(56)
    expect(enRangoPlan('2026-01-13', '2026-11-20')).toBe(true)
    expect(enRangoPlan('2027-01-15', '2026-11-20')).toBe(true)
    expect(enRangoPlan('2027-01-16', '2026-11-20')).toBe(false)
    expect(enRangoPlan('2026-13-01', '2026-11-20')).toBe(false)
  })
  it('arma el mes en semanas de lunes a domingo', () => {
    const semanas = calendarioMes('2026-11-20')
    expect(semanas[0]).toEqual([null, null, null, null, null, null, '2026-11-01']) // 1 de noviembre 2026 es domingo
    expect(semanas.at(-1)?.at(0)).toBe('2026-11-30')
    expect(semanas.flat().filter(Boolean)).toHaveLength(30)
  })
  it('cambia de mes y de año', () => {
    expect(mesSiguiente('2026-12-15')).toBe('2027-01-01')
    expect(mesAnterior('2026-01-31')).toBe('2025-12-01')
  })
})

describe('receta (meal prep)', () => {
  it('calcula los valores por 100 g y por porción', () => {
    const r = calcularReceta([arroz, pollo], 5)
    expect(r.totalG).toBe(2200)
    expect(r.porcionG).toBe(440)
    expect(r.porPorcion.kcal).toBe(656) // (1300 + 1980) / 5
    expect(r.porPorcion.proteina).toBeCloseTo(79.8, 1)
    expect(r.por100.kcal).toBeCloseTo(149.1, 1)
  })
  it('valida nombre, porciones e ingredientes', () => {
    expect(validarReceta({ nombre: '', porciones: 0, ingredientes: [] })).toEqual({
      nombre: 'Ponle un nombre',
      porciones: 'Entre 1 y 100 porciones',
      ingredientes: 'Agrega al menos un ingrediente',
    })
    expect(validarReceta({ nombre: 'Arroz con pollo', porciones: 5, ingredientes: [{ ...arroz, gramos: 0 }] })).toEqual({
      ingredientes: 'Cada ingrediente necesita sus gramos (entre 1 y 10.000)',
    })
    expect(validarReceta({ nombre: 'Arroz con pollo', porciones: 5, ingredientes: [arroz, pollo] })).toEqual({})
  })
})

describe('repartir y repetir', () => {
  it('elige los días de la semana pedidos dentro del rango', () => {
    // lunes 23 al domingo 29 de noviembre; lunes a viernes
    expect(diasParaRepartir('2026-11-23', '2026-11-29', [1, 2, 3, 4, 5])).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'])
    expect(diasParaRepartir('2026-11-23', '2026-11-29', [6, 0])).toEqual(['2026-11-28', '2026-11-29'])
  })
  it('repite una fecha cada semana, sin pasarse del límite del plan', () => {
    expect(fechasRepetidas('2026-11-23', 3, '2026-11-20')).toEqual(['2026-11-30', '2026-12-07', '2026-12-14'])
    expect(fechasRepetidas('2027-01-08', 2, '2026-11-20')).toEqual(['2027-01-15'])
  })
})

describe('lista de compras', () => {
  const receta = { alimentoClave: 'mio:r1', porciones: 5, ingredientes: [arroz, pollo] }
  it('suma los ingredientes de las porciones planificadas y los alimentos sueltos', () => {
    const lista = listaCompras(
      [
        { alimentoClave: 'mio:r1', nombre: 'Arroz con pollo', gramos: 440 },
        { alimentoClave: 'mio:r1', nombre: 'Arroz con pollo', gramos: 880 },
        { alimentoClave: 'catalogo:arroz', nombre: 'Arroz blanco cocido', gramos: 100 },
        { alimentoClave: 'catalogo:palta', nombre: 'Palta', gramos: 50 },
        { alimentoClave: null, nombre: 'Agregado rápido', gramos: null },
      ],
      [receta],
    )
    expect(lista).toEqual([
      { clave: 'catalogo:arroz', nombre: 'Arroz blanco cocido', gramos: 700 },
      { clave: 'catalogo:palta', nombre: 'Palta', gramos: 50 },
      { clave: 'catalogo:pollo', nombre: 'Pechuga de pollo cocida', gramos: 720 },
    ])
  })
})
