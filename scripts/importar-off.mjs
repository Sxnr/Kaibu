// Productos con marca vendidos en Chile desde Open Food Facts (licencia ODbL).
// Uso: curl -sL https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz | gunzip | node scripts/importar-off.mjs
// Solo entran productos con nombre, marca, código y valores por 100 g completos y coherentes (los datos de OFF pueden traer errores).
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const lineas = createInterface({ input: process.stdin, crlfDelay: Infinity })
let cab = null
const productos = new Map()
const vistos = new Set()
let leidos = 0

const numero = (v) => (v === undefined || v === '' ? NaN : Number(v))
const r1 = (n) => Math.round(n * 10) / 10
const limpiar = (t) => t.replace(/\s+/g, ' ').trim()

for await (const linea of lineas) {
  const c = linea.split('\t')
  if (!cab) {
    cab = Object.fromEntries(c.map((n, i) => [n, i]))
    continue
  }
  leidos++
  const v = (n) => c[cab[n]] ?? ''
  if (!v('countries_tags').includes('en:chile')) continue
  const codigo = v('code').trim()
  const nombre = limpiar(v('product_name_es') || v('product_name'))
  const marca = limpiar(v('brands').split(',')[0] ?? '')
  const [kcal, proteina, carbos, grasas] = ['energy-kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g'].map((n) => numero(v(n)))
  if (!/^\d{8,14}$/.test(codigo) || productos.has(codigo)) continue
  if (nombre.length < 2 || nombre.length > 80 || !marca || marca.length > 40) continue
  if ([kcal, proteina, carbos, grasas].some((x) => !Number.isFinite(x))) continue
  if (kcal < 0 || kcal > 900 || [proteina, carbos, grasas].some((g) => g < 0 || g > 100) || proteina + carbos + grasas > 100.5) continue
  // Se valida con los valores redondeados que se guardan.
  const calculadas = r1(proteina) * 4 + r1(carbos) * 4 + r1(grasas) * 9
  const diferencia = Math.abs(calculadas - Math.round(kcal))
  if (diferencia > 20 && diferencia / Math.max(Math.round(kcal), 1) > 0.15) continue
  const clave = `${nombre}|${marca}`.toLowerCase()
  if (vistos.has(clave)) continue
  vistos.add(clave)
  const g = numero(v('serving_quantity'))
  const porcion = g >= 1 && g <= 1000 ? { nombre: limpiar(v('serving_size')).slice(0, 30) || `${g} g`, g: r1(g) } : { nombre: '100 g', g: 100 }
  productos.set(codigo, {
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
  })
}

const lista = [...productos.values()].sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
writeFileSync(new URL('../src/data/catalogo/productos-cl.json', import.meta.url), `${JSON.stringify(lista)}\n`)
console.log(`Open Food Facts: ${leidos} filas leídas, ${lista.length} productos de Chile con datos completos`)
