// Ruido de valores (determinista): da forma al terreno, a la roca y a las vetas del mármol.

const fr = (x: number) => x - Math.floor(x)
export const hash = (x: number, y: number): number => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)

export function ruido(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

/** Varias capas de ruido, cada una más fina y más suave. */
export function fbm(x: number, y: number, octavas = 5): number {
  let s = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < octavas; i++) {
    s += a * ruido(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return s
}

/** Crestas (para afloramientos y grietas). */
export const crestas = (x: number, y: number, octavas = 4): number => 1 - Math.abs(2 * fbm(x, y, octavas) - 1)

export const ruido3 = (x: number, y: number, z: number): number =>
  (fbm(x + z * 0.71, y - z * 0.37, 4) + fbm(y + 17.3, z + 3.1, 4) + fbm(z - 9.7, x + 5.3, 4)) / 3

export type Rgb = [number, number, number]
export const mezclaRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
