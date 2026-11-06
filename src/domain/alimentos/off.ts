// Producto de Open Food Facts (licencia ODbL) → formato de productos-cl.json.
// Mismas reglas que scripts/importar-off.mjs, y además acepta productos que solo traen valores por porción.
// Sin imports con "@/": lo usa también el script de Node (scripts/importar-off-api.mjs).

export interface ProductoOffCrudo {
  code?: string
  product_name_es?: string
  product_name?: string
  brands?: string
  serving_size?: string
  serving_quantity?: number | string
  nutriments?: Record<string, number | string | undefined>
}

export interface ProductoCatalogo {
  id: string
  nombre: string
  marca: string
  codigo: string
  categoria: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcion: { nombre: string; g: number }
  fuente: string
  alias: string[]
}

const r1 = (n: number) => Math.round(n * 10) / 10
const limpiar = (t: string) => t.replace(/\s+/g, ' ').trim()
const numero = (v: unknown) => (v === undefined || v === null || v === '' ? NaN : Number(v))
const CAMPOS = ['energy-kcal', 'proteins', 'carbohydrates', 'fat'] as const

/** Valores por 100 g; si faltan, se calculan desde los valores por porción. null si no hay datos completos. */
function por100(n: Record<string, unknown>, porcionG: number): [number, number, number, number] | null {
  const directos = CAMPOS.map((c) => numero(n[`${c}_100g`]))
  if (directos.every(Number.isFinite)) return directos as [number, number, number, number]
  if (!(porcionG >= 1 && porcionG <= 1000)) return null
  const porPorcion = CAMPOS.map((c) => numero(n[`${c}_serving`]))
  if (!porPorcion.every(Number.isFinite)) return null
  return porPorcion.map((v) => (v * 100) / porcionG) as [number, number, number, number]
}

export function productoDesdeOff(p: ProductoOffCrudo): ProductoCatalogo | null {
  const codigo = String(p.code ?? '').trim()
  const nombre = limpiar(p.product_name_es || p.product_name || '')
  const marca = limpiar((p.brands ?? '').split(',')[0] ?? '')
  if (!/^\d{8,14}$/.test(codigo)) return null
  if (nombre.length < 2 || nombre.length > 80 || !marca || marca.length > 40) return null
  const g = numero(p.serving_quantity)
  const valores = por100(p.nutriments ?? {}, g)
  if (!valores) return null
  const [kcal, proteina, carbos, grasas] = valores
  if (kcal < 0 || kcal > 900 || [proteina, carbos, grasas].some((x) => x < 0 || x > 100) || proteina + carbos + grasas > 100.5) return null
  // Las kcal deben cuadrar con los macros (con los valores redondeados que se guardan).
  const calculadas = r1(proteina) * 4 + r1(carbos) * 4 + r1(grasas) * 9
  const diferencia = Math.abs(calculadas - Math.round(kcal))
  if (diferencia > 20 && diferencia / Math.max(Math.round(kcal), 1) > 0.15) return null
  const porcion = g >= 1 && g <= 1000 ? { nombre: limpiar(p.serving_size ?? '').slice(0, 30) || `${r1(g)} g`, g: r1(g) } : { nombre: '100 g', g: 100 }
  return {
    id: `off-${codigo}`,
    nombre,
    marca,
    codigo,
    categoria: 'Productos envasados',
    kcal: Math.round(kcal),
    proteina: r1(proteina),
    carbos: r1(carbos),
    grasas: r1(grasas),
    porcion,
    fuente: 'Open Food Facts (datos de la comunidad, licencia ODbL)',
    alias: [],
  }
}
