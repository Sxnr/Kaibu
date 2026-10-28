// Genera los efectos de sonido del video por código (100 % propios, sin licencias de terceros).
// Uso: node scripts/sonidos.mjs → public/sonidos/*.wav
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sonidos')
mkdirSync(SALIDA, { recursive: true })

// Azar con semilla: el mismo sonido cada vez que se genera.
let semilla = 7
const azar = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0
  return semilla / 4294967296
}
const ruido = () => azar() * 2 - 1

function guardar(nombre, datos) {
  let max = 0
  for (const v of datos) max = Math.max(max, Math.abs(v))
  const escala = max > 0 ? 0.89 / max : 1
  const buf = Buffer.alloc(44 + datos.length * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + datos.length * 2, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(datos.length * 2, 40)
  datos.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * escala)) * 32767), 44 + i * 2))
  writeFileSync(path.join(SALIDA, `${nombre}.wav`), buf)
  console.log('  ✓', nombre)
}

const vacio = (seg) => new Float32Array(Math.round(seg * SR))
const ruidoDe = (seg) => Float32Array.from(vacio(seg), () => ruido())

/** Filtro pasa-banda (variable de estado) con frecuencia que cambia en el tiempo. */
function pasaBanda(entrada, frec, q = 0.7) {
  const sal = new Float32Array(entrada.length)
  let bajo = 0
  let banda = 0
  for (let i = 0; i < entrada.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(frec(i / SR), SR / 6)) / SR)
    bajo += f * banda
    const alto = entrada[i] - bajo - q * banda
    banda += f * alto
    sal[i] = banda
  }
  return sal
}

function pasaBajo(entrada, corte) {
  const sal = new Float32Array(entrada.length)
  const a = 1 - Math.exp((-2 * Math.PI * corte) / SR)
  let y = 0
  for (let i = 0; i < entrada.length; i++) sal[i] = y += a * (entrada[i] - y)
  return sal
}

function sumar(destino, fuente, desde = 0, vol = 1) {
  const d = Math.round(desde * SR)
  for (let i = 0; i < fuente.length && d + i < destino.length; i++) destino[d + i] += fuente[i] * vol
  return destino
}

/** Tono con caída de frecuencia y de volumen. */
function tono(dur, f0, f1, caida) {
  const s = vacio(dur)
  let fase = 0
  for (let i = 0; i < s.length; i++) {
    const t = i / SR
    const f = f1 + (f0 - f1) * Math.exp(-t * 18)
    fase += (2 * Math.PI * f) / SR
    s[i] = Math.sin(fase) * Math.exp(-t * caida)
  }
  return s
}

/** Eco simple para dar espacio. */
function eco(s, retardo = 0.09, veces = 4, factor = 0.35) {
  const out = new Float32Array(s.length + Math.round(retardo * veces * SR))
  for (let n = 0; n <= veces; n++) sumar(out, s, retardo * n, Math.pow(factor, n))
  return out
}

const decae = (s, tau) => {
  for (let i = 0; i < s.length; i++) s[i] *= Math.exp(-i / (SR * tau))
  return s
}

/* ---------- Sonidos ---------- */

function soplido(dur, f0, f1, ataque = 0.45) {
  const filtrado = pasaBanda(ruidoDe(dur), (t) => f0 * Math.pow(f1 / f0, t / dur), 1.1)
  for (let i = 0; i < filtrado.length; i++) {
    const x = i / filtrado.length
    filtrado[i] *= x < ataque ? Math.pow(x / ataque, 2) : Math.pow(1 - (x - ataque) / (1 - ataque), 2.2)
  }
  return filtrado
}

guardar('whoosh-corto', soplido(0.32, 700, 4200, 0.4))
guardar('whoosh', soplido(0.6, 450, 3200))
guardar('whoosh-grave', soplido(0.85, 180, 1400, 0.5))
guardar('swish', soplido(0.45, 5200, 900, 0.3))

guardar('pop', sumar(tono(0.14, 1100, 340, 32), pasaBanda(ruidoDe(0.01), () => 3500), 0, 0.5))
guardar('tic', tono(0.04, 2600, 2400, 120))
guardar('blip', eco(tono(0.12, 880, 620, 30), 0.07, 3, 0.3))
guardar('tecla', sumar(decae(pasaBanda(ruidoDe(0.02), () => 3800, 0.5), 0.004), tono(0.05, 240, 160, 60), 0, 0.6))
guardar('toque', sumar(tono(0.09, 700, 260, 45), pasaBanda(ruidoDe(0.012), () => 2500), 0, 0.4))

guardar('conteo', (() => {
  // Tics cada vez más rápidos que terminan en una campanita.
  const s = vacio(1.4)
  let t = 0
  let paso = 0.075
  while (t < 0.8) {
    sumar(s, tono(0.035, 2300 + t * 900, 2200, 140), t, 0.55)
    t += paso
    paso = Math.max(0.035, paso * 0.92)
  }
  const ding = vacio(0.6)
  for (const [f, v] of [[1318.5, 1], [1975.5, 0.5], [2637, 0.25]]) sumar(ding, tono(0.6, f, f, 6), 0, v)
  return sumar(s, eco(ding, 0.08, 3, 0.3), 0.82, 0.8)
})())

guardar('golpe', sumar(tono(0.7, 140, 42, 6), decae(pasaBajo(ruidoDe(0.25), 900), 0.05), 0, 1.2))
guardar('sello', sumar(tono(0.3, 220, 90, 14), decae(pasaBanda(ruidoDe(0.09), () => 1800, 0.9), 0.025), 0, 1.4))

guardar('subida', (() => {
  // Tensión antes del drop: ruido y tono que suben.
  const dur = 2.4
  const r = pasaBanda(ruidoDe(dur), (t) => 300 * Math.pow(20, t / dur), 1.4)
  let fase = 0
  for (let i = 0; i < r.length; i++) {
    const x = i / r.length
    fase += (2 * Math.PI * (110 * Math.pow(4, x))) / SR
    r[i] = (r[i] * 0.8 + Math.sin(fase) * 0.25 * x) * Math.pow(x, 2.2)
  }
  return r
})())

guardar('explosion', (() => {
  const s = vacio(2.2)
  sumar(s, tono(1.6, 110, 32, 2.6), 0, 1.3)
  sumar(s, pasaBajo(decae(ruidoDe(1.5), 0.28), 2400), 0, 1.1)
  // Trozos de metal y vidrio que caen
  for (let n = 0; n < 34; n++) {
    const f = 2200 + azar() * 5200
    sumar(s, tono(0.18, f, f * 0.98, 26 + azar() * 20), 0.03 + Math.pow(azar(), 1.6) * 1.2, 0.18 + azar() * 0.2)
  }
  for (let n = 0; n < 5; n++) {
    const f = 600 + azar() * 500
    sumar(s, tono(0.5, f, f * 0.97, 9), 0.05 + azar() * 0.5, 0.25)
  }
  return s
})())

guardar('brillo', (() => {
  const s = vacio(1.6)
  ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => sumar(s, tono(1.0, f, f, 4.5), i * 0.06, 0.6))
  return eco(s, 0.11, 5, 0.38)
})())

guardar('ding', eco(tono(0.5, 1568, 1568, 7), 0.09, 3, 0.3))
