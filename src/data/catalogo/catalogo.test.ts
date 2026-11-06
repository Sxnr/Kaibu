import { describe, expect, it } from 'vitest'
import { buscarAlimentos } from '@/domain/alimentos/busqueda'
import { nutrientesDeReceta } from '@/domain/alimentos/recetas'
import { validarCoherenciaKcal } from '@/domain/calc/dia'
import catalogo from './catalogo-cl.json'
import { ALIMENTOS_CATALOGO } from './index'
import mundo from './mundo.json'
import preparaciones from './preparaciones-cl.json'
import productos from './productos-cl.json'

const CATEGORIAS = [
  'Panes y cereales',
  'Tubérculos y legumbres',
  'Carnes',
  'Pescados y mariscos',
  'Huevos y lácteos',
  'Frutas',
  'Frutos secos',
  'Verduras',
  'Aceites y grasas',
  'Dulces y bebidas',
  'Salsas y condimentos',
  'Preparaciones',
  'Suplementos',
]

// Su energía no sale de los macros: alcohol (7 kcal/g), ácido acético del vinagre y mucha fibra (cacao, salvado, especias).
const CON_ALCOHOL = ['cerveza', 'cerveza-light', 'vino-tinto', 'vino-blanco', 'pisco', 'ron', 'espumante', 'peras-vino', 'jote', 'piscola', 'terremoto']
const CON_FIBRA = ['cacao-polvo', 'salvado-trigo', 'merken', 'canela', 'oregano', 'comino']
const SIN_COHERENCIA = new Set([...CON_ALCOHOL, ...CON_FIBRA, 'vinagre'])

describe('catálogo de alimentos', () => {
  it('tiene unos 600 alimentos genéricos, sin ids ni nombres repetidos', () => {
    expect(catalogo.length).toBeGreaterThanOrEqual(550)
    expect(catalogo.length).toBeLessThanOrEqual(700)
    expect(new Set(catalogo.map((a) => a.id)).size).toBe(catalogo.length)
    expect(new Set(catalogo.map((a) => a.nombre.toLowerCase())).size).toBe(catalogo.length)
  })

  it('cada alimento cumple RD-06: nombre, valores por 100 g, porción, fuente y categoría conocida', () => {
    const malos = catalogo.filter(
      (a) =>
        a.nombre.length < 2 ||
        a.nombre.length > 80 ||
        a.kcal < 0 ||
        a.kcal > 900 ||
        [a.proteina, a.carbos, a.grasas].some((g) => g < 0 || g > 100) ||
        !(a.porcion.g > 0) ||
        !a.porcion.nombre ||
        !a.fuente ||
        !CATEGORIAS.includes(a.categoria),
    )
    expect(malos.map((a) => a.id)).toEqual([])
  })

  it('las kcal cuadran con los macros (RN-15: ±15 %, o ±20 kcal en alimentos livianos)', () => {
    const incoherentes = catalogo.filter((a) => {
      if (SIN_COHERENCIA.has(a.id)) return false
      const calculadas = a.proteina * 4 + a.carbos * 4 + a.grasas * 9
      const diferencia = Math.abs(calculadas - a.kcal)
      return diferencia > 20 && diferencia / Math.max(a.kcal, 1) > 0.15
    })
    expect(incoherentes.map((a) => a.id)).toEqual([])
  })

  it('la gran mayoría pasa la validación estricta de ±15 % que se usa al crear alimentos propios', () => {
    const ok = catalogo.filter((a) => validarCoherenciaKcal(a)).length
    expect(ok / catalogo.length).toBeGreaterThan(0.85)
  })

  it('las preparaciones coinciden con el cálculo de su receta', () => {
    const porId = new Map(catalogo.map((a) => [a.id, a]))
    for (const p of preparaciones) {
      const esperado = nutrientesDeReceta(
        p.ingredientes.map(([id, gramos]) => ({ por100: porId.get(id as string)!, gramos: gramos as number })),
        p.pesoFinal,
      )
      expect(porId.get(p.id), p.id).toMatchObject(esperado)
    }
  })

  it('encuentra comidas chilenas por su nombre o su alias', () => {
    const primero = (q: string) => buscarAlimentos(ALIMENTOS_CATALOGO, q)[0]?.nombre
    expect(primero('pastel de choclo')).toBe('Pastel de choclo')
    expect(primero('reineta')).toMatch(/Reineta/)
    expect(primero('zapallo italiano')).toMatch(/Zapallo italiano/)
    expect(primero('mote con huesillo')).toBe('Mote con huesillo')
    expect(primero('completo')).toBe('Completo italiano')
    expect(primero('palta')).toBe('Palta')
    expect(buscarAlimentos(ALIMENTOS_CATALOGO, 'porotos').length).toBeGreaterThanOrEqual(5)
  })

  it('los productos con marca (Open Food Facts) traen código único, marca y valores válidos y coherentes', () => {
    expect(productos.length).toBeGreaterThan(1000)
    expect(new Set(productos.map((p) => p.codigo)).size).toBe(productos.length)
    const malos = productos.filter((p) => {
      const calculadas = p.proteina * 4 + p.carbos * 4 + p.grasas * 9
      const diferencia = Math.abs(calculadas - p.kcal)
      return (
        !/^\d{8,14}$/.test(p.codigo) ||
        !p.marca ||
        p.nombre.length < 2 ||
        p.nombre.length > 80 ||
        p.kcal < 0 ||
        p.kcal > 900 ||
        !(p.porcion.g > 0) ||
        (diferencia > 20 && diferencia / Math.max(p.kcal, 1) > 0.15)
      )
    })
    expect(malos.map((p) => p.id)).toEqual([])
  })

  it('encuentra productos por su marca', () => {
    expect(buscarAlimentos(productos, 'soprole').length).toBeGreaterThan(10)
    expect(buscarAlimentos(productos, 'colun').length).toBeGreaterThan(10)
  })

  it('encuentra los lácteos con proteína y las proteínas en polvo más comunes', () => {
    expect(buscarAlimentos(productos, 'goodness protein').length).toBeGreaterThanOrEqual(3)
    expect(buscarAlimentos(productos, 'soprole protein').length).toBeGreaterThanOrEqual(5)
    expect(buscarAlimentos(productos, 'colun protein plus').length).toBeGreaterThanOrEqual(3)
    expect(buscarAlimentos(productos, 'leche protein').length).toBeGreaterThanOrEqual(2)
    expect(buscarAlimentos(productos, 'whey').length).toBeGreaterThanOrEqual(10)
  })
})

describe('comida del mundo y cadenas (USDA, se carga aparte)', () => {
  it('cada alimento trae id único, porción, fuente USDA y kcal coherentes con los macros', () => {
    expect(mundo.length).toBeGreaterThanOrEqual(200)
    expect(new Set(mundo.map((a) => a.id)).size).toBe(mundo.length)
    const malos = mundo.filter((a) => {
      const calculadas = a.proteina * 4 + a.carbos * 4 + a.grasas * 9
      const diferencia = Math.abs(calculadas - a.kcal)
      return (
        !a.id.startsWith('mundo-') ||
        !a.fuente.startsWith('USDA') ||
        !(a.porcion.g > 0) ||
        (diferencia > 20 && diferencia / Math.max(a.kcal, 1) > 0.15)
      )
    })
    expect(malos.map((a) => a.id)).toEqual([])
  })

  it('las cadenas traen su marca y avisan que la receta es de EE. UU.', () => {
    const cadenas = mundo.filter((a) => a.categoria === 'Comida rápida')
    expect(cadenas.length).toBeGreaterThanOrEqual(60)
    expect(cadenas.every((a) => !!a.marca && a.fuente.includes('EE. UU.'))).toBe(true)
  })

  it('no repite nombres del catálogo chileno', () => {
    const chilenos = new Set(catalogo.map((a) => a.nombre.toLowerCase()))
    expect(mundo.filter((a) => !a.marca && chilenos.has(a.nombre.toLowerCase())).map((a) => a.nombre)).toEqual([])
  })

  it('encuentra comida de afuera y de cadenas como la escribe la gente', () => {
    const primero = (q: string) => buscarAlimentos(mundo, q)[0]?.nombre
    expect(primero('harina pan')).toMatch(/Harina de maíz precocida/)
    expect(primero('arepa')).toBe('Arepa')
    expect(primero('big mac')).toBe('Big Mac')
    expect(buscarAlimentos(mundo, 'whopper').length).toBeGreaterThanOrEqual(4)
    expect(buscarAlimentos(mundo, 'kfc').length).toBeGreaterThanOrEqual(5)
    expect(buscarAlimentos(mundo, 'tostones').length).toBeGreaterThanOrEqual(1)
    expect(buscarAlimentos(mundo, 'sushi').length).toBeGreaterThanOrEqual(5)
    expect(buscarAlimentos(mundo, 'burrito').length).toBeGreaterThanOrEqual(5)
  })
})
