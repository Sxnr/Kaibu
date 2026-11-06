// Comida rápida de cadenas internacionales y platos de otros países, con valores de USDA (dominio público).
// Uso: node scripts/importar-mundo.mjs <carpeta SR Legacy> <carpeta FNDDS (survey)>
// Sin carpetas: reutiliza los valores ya guardados en mundo.json (sirve para cambiar nombres, porciones o alias).
// Lee mundo-seleccion.json y escribe mundo.json (se carga aparte, solo al entrar a Agregar).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [carpetaSr, carpetaFndds] = process.argv.slice(2)
const ruta = (archivo) => new URL(`../src/data/catalogo/${archivo}`, import.meta.url)
const leer = (archivo) => JSON.parse(readFileSync(ruta(archivo), 'utf8'))
const seleccion = leer('mundo-seleccion.json')
const guardados = new Map(carpetaSr ? [] : leer('mundo.json').map((a) => [a.id, a]))

// SR Legacy usa los ids nuevos de nutrientes; FNDDS usa los números antiguos.
const NUTRIENTES = { 1008: 'kcal', 1003: 'proteina', 1005: 'carbos', 1004: 'grasas', 208: 'kcal', 203: 'proteina', 205: 'carbos', 204: 'grasas' }
const buscados = new Set(seleccion.map((s) => String(s.fdc)))
const valores = new Map()
for (const carpeta of carpetaSr ? [carpetaSr, carpetaFndds] : []) {
  for (const linea of readFileSync(join(carpeta, 'food_nutrient.csv'), 'utf8').split('\n').slice(1)) {
    const [, fdc, nutriente, cantidad] = linea.split('","').map((c) => c.replaceAll('"', ''))
    const campo = NUTRIENTES[nutriente]
    if (!campo || !buscados.has(fdc)) continue
    valores.set(fdc, { ...valores.get(fdc), [campo]: Number(cantidad) })
  }
}

const r1 = (n) => Math.round(n * 10) / 10
const FUENTE = { SR: 'USDA FoodData Central (SR Legacy)', FNDDS: 'USDA FoodData Central (FNDDS)' }
const lista = seleccion.map((s) => {
  const id = `mundo-${s.id}`
  const v = carpetaSr ? valores.get(String(s.fdc)) : guardados.get(id)
  if (!v || ['kcal', 'proteina', 'carbos', 'grasas'].some((k) => !Number.isFinite(v[k]))) {
    throw new Error(`Faltan nutrientes para ${s.id} (${s.fdc}): corre el script con las carpetas de USDA`)
  }
  // Las cadenas publican su receta de EE. UU.; se avisa que en Chile puede variar.
  const fuente = s.marca ? `${FUENTE[s.base]} · receta de EE. UU., en Chile puede variar` : FUENTE[s.base]
  return {
    id,
    nombre: s.nombre,
    ...(s.marca ? { marca: s.marca } : {}),
    categoria: s.categoria,
    kcal: Math.round(v.kcal),
    proteina: r1(v.proteina),
    carbos: r1(v.carbos),
    grasas: r1(v.grasas),
    porcion: s.porcion,
    fuente,
    alias: s.alias,
  }
})

writeFileSync(ruta('mundo.json'), `${JSON.stringify(lista)}\n`)
console.log(`Listo: ${lista.length} alimentos del mundo (${lista.filter((a) => a.marca).length} de cadenas)`)
