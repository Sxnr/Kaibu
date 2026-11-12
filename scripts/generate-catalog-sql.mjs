// Genera supabase/seed.sql con el catálogo inicial a partir de src/data/catalogo/catalogo-cl.json.
// Uso: npm run catalog:sql
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const datos = JSON.parse(await readFile(new URL('../src/data/catalogo/catalogo-cl.json', import.meta.url), 'utf8'))
const q = (s) => `'${String(s).replaceAll("'", "''")}'`
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`

const filas = datos.map(
  (a) =>
    `  (${q(a.id)}, ${q(a.nombre)}, ${q(a.categoria)}, ${a.kcal}, ${a.proteina}, ${a.carbos}, ${a.grasas}, ${q(a.porcion.nombre)}, ${a.porcion.g}, ${arr(a.alias)}, ${q(a.fuente)})`,
)

const sql = `-- Catálogo inicial de Kaibu (${datos.length} alimentos genéricos, valores por 100 g).
-- Archivo generado automáticamente con: npm run catalog:sql (no editar a mano).
insert into public.foods_catalog
  (id, nombre, categoria, kcal_100, proteina_100, carbos_100, grasas_100, porcion_nombre, porcion_g, alias, fuente)
values
${filas.join(',\n')}
on conflict (id) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  kcal_100 = excluded.kcal_100,
  proteina_100 = excluded.proteina_100,
  carbos_100 = excluded.carbos_100,
  grasas_100 = excluded.grasas_100,
  porcion_nombre = excluded.porcion_nombre,
  porcion_g = excluded.porcion_g,
  alias = excluded.alias,
  fuente = excluded.fuente;
`
await writeFile(new URL('../supabase/seed.sql', import.meta.url), sql)
console.log(`supabase/seed.sql generado con ${datos.length} alimentos`)

// Productos con marca (Open Food Facts) y comida del mundo (USDA), en partes para pegarlas en el SQL Editor.
// Requiere la migración 20261112000100_catalogo_colaborativo.sql (columnas marca y código).
const leer = async (archivo) => JSON.parse(await readFile(new URL(`../src/data/catalogo/${archivo}`, import.meta.url), 'utf8'))
const productos = [...(await leer('productos-cl.json')), ...(await leer('mundo.json'))]
const nulo = (v) => (v === undefined || v === null || v === '' ? 'null' : q(v))
const POR_PARTE = 1000
await mkdir(new URL('../supabase/catalogo/', import.meta.url), { recursive: true })
const partes = Math.ceil(productos.length / POR_PARTE)
for (let i = 0; i < partes; i++) {
  const lote = productos.slice(i * POR_PARTE, (i + 1) * POR_PARTE)
  const filasLote = lote.map(
    (a) =>
      `  (${q(a.id)}, ${q(a.nombre)}, ${nulo(a.marca)}, ${a.codigo && /^\d{8,14}$/.test(a.codigo) ? q(a.codigo) : 'null'}, ${q(a.categoria)}, ${a.kcal}, ${a.proteina}, ${a.carbos}, ${a.grasas}, ${q(a.porcion.nombre)}, ${a.porcion.g}, ${arr(a.alias ?? [])}, ${q(a.fuente)})`,
  )
  const parte = `-- Catálogo de Kaibu · productos con marca y comida del mundo · parte ${i + 1} de ${partes} (${lote.length} alimentos).
-- Archivo generado con: npm run catalog:sql (no editar a mano). Se puede ejecutar más de una vez.
insert into public.foods_catalog
  (id, nombre, marca, codigo, categoria, kcal_100, proteina_100, carbos_100, grasas_100, porcion_nombre, porcion_g, alias, fuente)
values
${filasLote.join(',\n')}
on conflict (id) do update set
  nombre = excluded.nombre, marca = excluded.marca, codigo = excluded.codigo, categoria = excluded.categoria,
  kcal_100 = excluded.kcal_100, proteina_100 = excluded.proteina_100, carbos_100 = excluded.carbos_100, grasas_100 = excluded.grasas_100,
  porcion_nombre = excluded.porcion_nombre, porcion_g = excluded.porcion_g, alias = excluded.alias, fuente = excluded.fuente;
`
  await writeFile(new URL(`../supabase/catalogo/productos-${i + 1}.sql`, import.meta.url), parte)
}
console.log(`supabase/catalogo/: ${productos.length} productos en ${partes} partes`)
