import { describe, expect, it } from 'vitest'
import { ALIMENTOS_CATALOGO } from '@/data/catalogo'
import { comidaSegunHora, copiarRegistros, nuevoRegistro, registroRapido, textoUnidad } from './registrar'

const huevo = ALIMENTOS_CATALOGO.find((a) => a.clave === 'catalogo:huevo')!

describe('registrar alimentos', () => {
  it('por porción: 2 huevos = 100 g', () => {
    const r = nuevoRegistro({ userId: 'u', fecha: '2026-10-25', comida: 'desayuno', alimento: huevo, modo: 'porcion', cantidad: 2 })
    expect(r.gramos).toBe(100)
    expect(r.kcal).toBe(143)
    expect(r.unidad).toBe('2 × 1 unidad (100 g)')
    expect(r.alimentoClave).toBe('catalogo:huevo')
  })
  it('por gramos', () => {
    const r = nuevoRegistro({ userId: 'u', fecha: '2026-10-25', comida: 'desayuno', alimento: huevo, modo: 'g', cantidad: 75 })
    expect(r.kcal).toBe(107)
    expect(textoUnidad(huevo, 'g', 75)).toBe('75 g')
  })
  it('agregar rápido solo con kcal y proteína', () => {
    const r = registroRapido('u', '2026-10-25', 'once', 350, 20)
    expect(r).toMatchObject({ nombre: 'Agregado rápido', kcal: 350, proteina: 20, origen: 'rapido', gramos: null })
  })
  it('copiar crea registros nuevos en otra fecha', () => {
    const r = registroRapido('u', '2026-10-24', 'once', 350, 20)
    const [c] = copiarRegistros([r], '2026-10-25', 'cena')
    expect(c?.id).not.toBe(r.id)
    expect(c).toMatchObject({ fecha: '2026-10-25', comida: 'cena', kcal: 350 })
  })
  it('sugiere la comida según la hora', () => {
    const ids = ['desayuno', 'almuerzo', 'once', 'cena']
    expect(comidaSegunHora(ids, 8)).toBe('desayuno')
    expect(comidaSegunHora(ids, 13)).toBe('almuerzo')
    expect(comidaSegunHora(ids, 18)).toBe('once')
    expect(comidaSegunHora(['desayuno', 'almuerzo', 'cena'], 18)).toBe('cena')
    expect(comidaSegunHora(ids, 22)).toBe('cena')
  })
})
