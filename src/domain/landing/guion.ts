// Guion de la historia 3D de la landing (Sísifo): todo depende del avance p (0 a 1) del scroll.
// Son funciones puras: la escena 3D y los textos solo leen estos valores.

export const lim = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
/** Avance de 0 a 1 dentro del tramo [a, b]. */
export const tramo = (p: number, a: number, b: number): number => lim((p - a) / (b - a))
/** Curva suave (sin tirones al empezar ni al terminar). */
export const suave = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10)

/** Avance (metros) de Sísifo por la ladera en cada punto del guion. */
const PASOS_Z: [number, number][] = [
  [0, 0],
  [0.18, 0.45],
  [0.27, 0.7],
  [0.36, 1.4],
  [0.5, 7],
  [0.62, 10.5],
  [0.75, 15],
  [0.88, 23],
  [1, 24.6],
]

export function avanceZ(p: number): number {
  for (let i = 1; i < PASOS_Z.length; i++) {
    const [a, za] = PASOS_Z[i - 1]!
    const [b, zb] = PASOS_Z[i]!
    if (p <= b) return lerp(za, zb, suave(tramo(p, a, b)))
  }
  return PASOS_Z[PASOS_Z.length - 1]![1]
}

export const CAPITULOS = 5
export const capituloActual = (p: number): number => Math.min(CAPITULOS - 1, Math.round(lim(p) * (CAPITULOS - 1)))

/** 0 empuja, 1 erguido en la cumbre. */
export const erguido = (p: number): number => suave(tramo(p, 0.86, 0.98))

export interface FichaComida {
  nombre: string
  kcal: number
  /** Avance en que sale volando de la roca. */
  inicio: number
  /** Ángulo (radianes) del punto de la roca donde va pegada. */
  angulo: number
}

export const FICHAS_COMIDA: FichaComida[] = [
  { nombre: 'Desayuno', kcal: 350, inicio: 0.4, angulo: 1.9 },
  { nombre: 'Almuerzo', kcal: 620, inicio: 0.445, angulo: 1.35 },
  { nombre: 'Once', kcal: 260, inicio: 0.49, angulo: 0.8 },
  { nombre: 'Cena', kcal: 480, inicio: 0.535, angulo: 0.3 },
]
export const META_KCAL = 2100

export const viajeFicha = (indice: number, p: number): number => {
  const f = FICHAS_COMIDA[indice]!
  return suave(tramo(p, f.inicio, f.inicio + 0.06))
}

/** La roca se achica un poco con cada comida anotada. */
export const escalaRoca = (p: number): number => 1 - FICHAS_COMIDA.reduce((s, _, i) => s + viajeFicha(i, p), 0) * 0.08

/** Kcal que ya llegaron al resumen "Hoy". */
export const kcalAnotadas = (p: number): number =>
  Math.round(FICHAS_COMIDA.reduce((s, f, i) => s + f.kcal * tramo(viajeFicha(i, p), 0.75, 1), 0))

export const opacidadFichas = (p: number): number => tramo(p, 0.14, 0.2) * (1 - tramo(p, 0.6, 0.64))
export const opacidadHoy = (p: number): number => tramo(p, 0.38, 0.42) * (1 - tramo(p, 0.64, 0.68))
export const opacidadAjuste = (p: number): number => tramo(p, 0.66, 0.7) * (1 - tramo(p, 0.86, 0.9))

/** Cuánto entró un capítulo en la pantalla (0 a 1), según la posición de su borde superior. */
export const avanceCapitulo = (top: number, altoPantalla: number): number => lim((altoPantalla * 0.82 - top) / (altoPantalla * 0.62))

/** Palabras del título que ya se encendieron. */
export const palabrasEncendidas = (avance: number, total: number): number => Math.min(total, Math.ceil(lim(avance) * total))

export interface Resorte {
  p: number
  v: number
}
/** Rigidez del resorte: llega en ~0,5 s, sin rebote (amortiguado crítico). */
const OMEGA = (2 * Math.PI) / 0.5

/** Un paso del resorte que sigue al scroll: la animación nunca salta aunque el scroll lo haga. */
export function pasoResorte({ p, v }: Resorte, objetivo: number, dt: number): Resorte {
  const v2 = v + (-2 * OMEGA * v - OMEGA * OMEGA * (p - objetivo)) * dt
  return { p: p + v2 * dt, v: v2 }
}

export const enReposo = ({ p, v }: Resorte, objetivo: number): boolean => Math.abs(p - objetivo) < 0.0003 && Math.abs(v) < 0.003

export const ZANCADA = 0.8
const APOYO = 0.6

export interface Pisada {
  x: number
  z: number
  /** Altura del pie sobre el suelo mientras da el paso. */
  alza: number
  /** 0 pie plano, 1 talón levantado (impulso). */
  talon: number
}

/**
 * Paso de un pie: apoyado (quieto en el suelo, despega el talón al final) o en el aire (avanza levantándose).
 * lado: 1 izquierdo, -1 derecho. e: 0 empuja, 1 erguido (pies quietos).
 */
export function pisada(z: number, desfase: number, lado: number, e: number): Pisada {
  const f = z / ZANCADA + desfase
  const k = Math.floor(f)
  const u = f - k
  const contacto = (j: number) => (j + 1 - desfase) * ZANCADA - 0.75
  let pz: number
  let alza = 0
  let talon: number
  if (u < APOYO) {
    pz = contacto(k)
    const t = lim((u - 0.3) / (APOYO - 0.3))
    talon = t * t * (3 - 2 * t)
  } else {
    const t = (u - APOYO) / (1 - APOYO)
    pz = lerp(contacto(k), contacto(k + 1), suave(t))
    alza = Math.sin(Math.PI * t) * 0.13
    talon = 1 - t
  }
  return {
    x: lerp(lado * 0.11, lado * 0.12, e),
    z: lerp(pz, z + lado * 0.06, e),
    alza: alza * (1 - e),
    talon: talon * (1 - e),
  }
}
