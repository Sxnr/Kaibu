// Amplía el catálogo: alimentos genéricos de USDA (dominio público) y preparaciones chilenas calculadas desde receta.
// Uso: node scripts/importar-catalogo.mjs <carpeta FoodData_Central_sr_legacy_food_csv_2018-04>
// Los alimentos originales del catálogo no se tocan; los importados se reemplazan en cada ejecución.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const carpeta = process.argv[2]
if (!carpeta) throw new Error('Indica la carpeta con los CSV de USDA SR Legacy')

const ruta = (archivo) => new URL(`../src/data/catalogo/${archivo}`, import.meta.url)
const leer = (archivo) => JSON.parse(readFileSync(ruta(archivo), 'utf8'))
const seleccion = leer('usda-seleccion.json')
const preparaciones = leer('preparaciones-cl.json')
const importados = new Set([...seleccion.map((s) => s.id), ...preparaciones.map((p) => p.id)])
const catalogo = leer('catalogo-cl.json').filter((a) => !importados.has(a.id))

// Nutrientes de USDA por 100 g: energía (kcal), proteína, carbohidratos y grasas.
const NUTRIENTES = { 1008: 'kcal', 1003: 'proteina', 1005: 'carbos', 1004: 'grasas' }
const buscados = new Set(seleccion.map((s) => String(s.fdc)))
const valores = new Map()
for (const linea of readFileSync(join(carpeta, 'food_nutrient.csv'), 'utf8').split('\n').slice(1)) {
  const [, fdc, nutriente, cantidad] = linea.split('","').map((c) => c.replaceAll('"', ''))
  const campo = NUTRIENTES[nutriente]
  if (!campo || !buscados.has(fdc)) continue
  valores.set(fdc, { ...valores.get(fdc), [campo]: Number(cantidad) })
}

const r1 = (n) => Math.round(n * 10) / 10
for (const s of seleccion) {
  const v = valores.get(String(s.fdc))
  if (!v || Object.keys(v).length !== 4) throw new Error(`Faltan nutrientes de USDA para ${s.id} (${s.fdc})`)
  catalogo.push({
    id: s.id,
    nombre: s.nombre,
    categoria: s.categoria,
    kcal: Math.round(v.kcal),
    proteina: r1(v.proteina),
    carbos: r1(v.carbos),
    grasas: r1(v.grasas),
    porcion: s.porcion,
    fuente: 'USDA FoodData Central (SR Legacy)',
    alias: s.alias,
  })
}

// Misma fórmula que nutrientesDeReceta (src/domain/alimentos/recetas.ts); la prueba del catálogo verifica que coincidan.
const porId = new Map(catalogo.map((a) => [a.id, a]))
for (const p of preparaciones) {
  const total = { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  for (const [id, gramos] of p.ingredientes) {
    const a = porId.get(id)
    if (!a) throw new Error(`La receta ${p.id} usa un ingrediente que no está en el catálogo: ${id}`)
    for (const campo of Object.keys(total)) total[campo] += (a[campo] * gramos) / 100
  }
  const f = 100 / p.pesoFinal
  catalogo.push({
    id: p.id,
    nombre: p.nombre,
    categoria: 'Preparaciones',
    kcal: Math.round(total.kcal * f),
    proteina: r1(total.proteina * f),
    carbos: r1(total.carbos * f),
    grasas: r1(total.grasas * f),
    porcion: p.porcion,
    fuente: 'Valor estimado desde una receta típica chilena (Kaibu); varía según la preparación',
    alias: p.alias,
  })
}

writeFileSync(ruta('catalogo-cl.json'), `${JSON.stringify(catalogo, null, 1)}\n`)
console.log(`Catálogo: ${catalogo.length} alimentos (${seleccion.length} de USDA y ${preparaciones.length} preparaciones importados)`)
