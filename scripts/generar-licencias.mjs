// Genera la lista de licencias de terceros (RF-48) a partir de las dependencias de producción.
// Se ejecuta antes de compilar: npm run build → src/features/legal/licencias.json
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const salida = execSync('npm ls --omit=dev --all --parseable --long', { encoding: 'utf8', maxBuffer: 1 << 24 })

const paginaDe = (pkg) => {
  if (typeof pkg.homepage === 'string') return pkg.homepage
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  if (!repo) return null
  return repo.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://').replace(/^github:/, 'https://github.com/')
}

const vistos = new Map()
for (const linea of salida.trim().split('\n').slice(1)) {
  const [ruta, id, estado] = linea.split(':')
  // Lo que no pertenece al árbol de la app (EXTRANEOUS, INVALID) no se publica.
  if (!ruta || !id || estado) continue
  const pkg = JSON.parse(readFileSync(join(ruta, 'package.json'), 'utf8'))
  const licencia = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'Sin licencia declarada')
  vistos.set(`${pkg.name}@${pkg.version}`, { nombre: pkg.name, version: pkg.version, licencia, pagina: paginaDe(pkg) })
}

const lista = [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
writeFileSync(new URL('../src/features/legal/licencias.json', import.meta.url), `${JSON.stringify(lista, null, 2)}\n`)
console.log(`Licencias: ${lista.length} paquetes de producción`)
