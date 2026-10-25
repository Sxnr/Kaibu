// Genera supabase/seed.sql con el catálogo inicial a partir de src/data/catalogo/catalogo-cl.json.
// Uso: npm run catalog:sql
import { readFile, writeFile } from 'node:fs/promises'

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
