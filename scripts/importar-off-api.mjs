// Amplía productos-cl.json con la API de Open Food Facts (licencia ODbL), sin descargar el archivo gigante:
// 1) todos los productos marcados como vendidos en Chile (también los que solo traen valores por porción),
// 2) proteínas en polvo y barras de marcas internacionales que se venden en Chile.
// Los productos que ya estaban se mantienen; los datos nuevos los actualizan. Respeta el límite de la API (pausa entre pedidos).
// Uso: node scripts/importar-off-api.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { productoDesdeOff } from '../src/domain/alimentos/off.ts'

// Buscador search-a-licious (la API v2 de búsqueda suele responder 503).
const API = 'https://search.openfoodfacts.org/search'
const CAMPOS = 'code,product_name_es,product_name,brands,serving_size,serving_quantity,nutriments'
const AGENTE = 'Kaibu/0.2 (app chilena de nutricion; github.com/Sxnr/Kaibu)'
const PAUSA_MS = 3000 // pausa amable entre pedidos
const ARCHIVO = new URL('../src/data/catalogo/productos-cl.json', import.meta.url)

// Marcas de suplementos y barras que se venden en Chile aunque Open Food Facts no las marque como "Chile".
const MARCAS_SUPLEMENTOS = [
  'optimum-nutrition', 'dymatize', 'muscletech', 'bsn', 'nutrex', 'universal-nutrition', 'myprotein', 'winkler-nutrition',
  'cellucor', 'rule-1', 'nature-valley', 'quest', 'wild-protein', 'barebells', 'grenade', 'nestle',
]
const ES_PROTEICO = /whey|protein|prote[ií]n|isolat|barra|bar\b|batido|shake/i

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

async function pagina(parametros) {
  const url = `${API}?${new URLSearchParams({ ...parametros, fields: CAMPOS, page_size: '100' })}`
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch(url, { headers: { 'User-Agent': AGENTE } }).catch(() => null)
    if (res?.ok) {
      const d = await res.json()
      // Este buscador entrega las marcas como lista.
      const products = (d.hits ?? []).map((h) => ({ ...h, brands: Array.isArray(h.brands) ? h.brands.join(',') : h.brands }))
      return { count: d.count ?? 0, products }
    }
    await dormir(PAUSA_MS * intento)
  }
  throw new Error(`Open Food Facts no respondió: ${url}`)
}

const anteriores = JSON.parse(readFileSync(ARCHIVO, 'utf8'))
const productos = new Map(anteriores.map((p) => [p.codigo, p]))
const vistos = new Set(anteriores.map((p) => `${p.nombre}|${p.marca}`.toLowerCase()))
let nuevos = 0

function agregar(crudo, filtro = () => true) {
  const p = productoDesdeOff(crudo)
  if (!p || !filtro(p)) return
  const clave = `${p.nombre}|${p.marca}`.toLowerCase()
  if (!productos.has(p.codigo) && vistos.has(clave)) return // mismo producto con otro código
  if (!productos.has(p.codigo)) nuevos++
  productos.set(p.codigo, p)
  vistos.add(clave)
}

// 1) Chile completo
const primera = await pagina({ q: 'countries_tags:"en:chile"', page: '1' })
const paginas = Math.ceil(primera.count / 100)
console.log(`Chile: ${primera.count} productos en ${paginas} páginas`)
for (const p of primera.products) agregar(p)
for (let n = 2; n <= paginas; n++) {
  await dormir(PAUSA_MS)
  const d = await pagina({ q: 'countries_tags:"en:chile"', page: String(n) })
  for (const p of d.products) agregar(p)
  if (n % 10 === 0) console.log(`  página ${n}/${paginas} · ${nuevos} nuevos`)
}

// 2) Suplementos y barras de marcas internacionales
for (const marca of MARCAS_SUPLEMENTOS) {
  await dormir(PAUSA_MS)
  const d = await pagina({ q: `brands_tags:"${marca}"`, page: '1' })
  const antes = nuevos
  for (const p of d.products) agregar(p, (x) => ES_PROTEICO.test(x.nombre))
  console.log(`  ${marca}: +${nuevos - antes}`)
}

const lista = [...productos.values()].sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
writeFileSync(ARCHIVO, `${JSON.stringify(lista)}\n`)
console.log(`Listo: ${lista.length} productos (${nuevos} nuevos, antes ${anteriores.length})`)
