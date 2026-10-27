// Renderiza las versiones del video (o fotogramas sueltos para revisar) preparando el proyecto una sola vez.
// Uso:
//   node scripts/renderizar.mjs                         → las 4 versiones en entregas/
//   node scripts/renderizar.mjs Vertical-Club           → solo esa versión
//   node scripts/renderizar.mjs --fotos Horizontal-Club 60 420 900   → fotogramas en out/fotos/
// Navegador opcional: REMOTION_NAVEGADOR=/ruta/a/chrome-headless-shell
import { bundle } from '@remotion/bundler'
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const VERSIONES = ['Horizontal-Club', 'Horizontal-Workout', 'Vertical-Club', 'Vertical-Workout']
const comun = {
  browserExecutable: process.env.REMOTION_NAVEGADOR ?? null,
  chromiumOptions: { gl: 'swangle' },
}

const args = process.argv.slice(2)
console.log('Preparando el proyecto…')
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, 'src/index.ts'), publicDir: path.join(RAIZ, 'public') })

async function composicion(id) {
  return selectComposition({ serveUrl, id, inputProps: {}, ...comun })
}

if (args[0] === '--fotos') {
  const [, id, ...cuadros] = args
  const comp = await composicion(id)
  mkdirSync(path.join(RAIZ, 'out/fotos'), { recursive: true })
  for (const c of cuadros) {
    const salida = path.join(RAIZ, `out/fotos/${id}-${String(c).padStart(4, '0')}.png`)
    await renderStill({ serveUrl, composition: comp, frame: Number(c), output: salida, ...comun })
    console.log('  ✓', path.relative(RAIZ, salida))
  }
} else {
  const ids = args.length ? args : VERSIONES
  mkdirSync(path.join(RAIZ, 'entregas'), { recursive: true })
  for (const id of ids) {
    const comp = await composicion(id)
    const salida = path.join(RAIZ, `entregas/kaibu-${id.toLowerCase()}.mp4`)
    const inicio = Date.now()
    let ultimo = -10
    await renderMedia({
      serveUrl,
      composition: comp,
      codec: 'h264',
      crf: 18,
      imageFormat: 'jpeg',
      jpegQuality: 92,
      audioCodec: 'aac',
      audioBitrate: '256k',
      concurrency: Math.max(1, os.cpus().length),
      outputLocation: salida,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100)
        if (pct >= ultimo + 10) {
          ultimo = pct
          console.log(`  ${id}: ${pct} %`)
        }
      },
      ...comun,
    })
    console.log(`✓ ${path.relative(RAIZ, salida)} (${Math.round((Date.now() - inicio) / 1000)} s)`)
  }
}
