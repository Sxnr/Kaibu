// Renderiza las versiones del video (o fotogramas sueltos para revisar) preparando el proyecto una sola vez.
// Uso:
//   node scripts/renderizar.mjs                         → las versiones elegidas (Club Music) en entregas/
//   node scripts/renderizar.mjs Vertical-Club           → solo esa versión
//   node scripts/renderizar.mjs --fotos Horizontal-Club 60 420 900   → fotogramas en out/fotos/
// Navegador opcional: REMOTION_NAVEGADOR=/ruta/a/chrome-headless-shell
import { bundle } from '@remotion/bundler'
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
// Versiones elegidas (Workout queda disponible pasando su nombre, p. ej. Horizontal-Workout).
const VERSIONES = ['Horizontal-Club', 'Vertical-Club']
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
    const crudo = path.join(RAIZ, `out/${id}-crudo.mp4`)
    mkdirSync(path.join(RAIZ, 'out'), { recursive: true })
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
      outputLocation: crudo,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100)
        if (pct >= ultimo + 10) {
          ultimo = pct
          console.log(`  ${id}: ${pct} %`)
        }
      },
      ...comun,
    })
    // Limitador final: música + efectos nunca saturan (el video se copia tal cual).
    const tmp = `${salida}.tmp.mp4`
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', crudo, '-c:v', 'copy', '-af', 'alimiter=limit=0.89:attack=3:release=60:level=false', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', tmp])
    renameSync(tmp, salida)
    console.log(`✓ ${path.relative(RAIZ, salida)} (${Math.round((Date.now() - inicio) / 1000)} s)`)
  }
}
