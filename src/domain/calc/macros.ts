// Macronutrientes y reparto por comida (sección 7).
import type { ComidaReparto, Objetivo } from './types'

export const KCAL_G = { proteina: 4, carbos: 4, grasas: 9 } as const
export const PROTEINA_MIN_GKG = 1.6
export const PROTEINA_MAX_GKG = 2.4
export const GRASAS_DEFECTO_GKG = 0.8
export const GRASAS_MIN_GKG = 0.6

export function proteinaPorDefecto(objetivo: Objetivo): number {
  return objetivo === 'perder' ? 2.0 : 1.8
}

export interface EntradaMacros {
  kcal: number
  pesoKg: number
  objetivo: Objetivo
  proteinaGKg?: number
  grasasGKg?: number
}

export interface ResultadoMacros {
  proteinaG: number
  grasasG: number
  carbosG: number
  proteinaGKg: number
  grasasGKg: number
  /** true si las kcal no alcanzan para cubrir proteína y grasas. */
  carbosInsuficientes: boolean
  pct: { proteina: number; carbos: number; grasas: number }
}

export function calcularMacros({ kcal, pesoKg, objetivo, proteinaGKg, grasasGKg }: EntradaMacros): ResultadoMacros {
  const pGKg = proteinaGKg ?? proteinaPorDefecto(objetivo)
  if (pGKg < PROTEINA_MIN_GKG || pGKg > PROTEINA_MAX_GKG) {
    throw new RangeError(`La proteína debe estar entre ${PROTEINA_MIN_GKG} y ${PROTEINA_MAX_GKG} g/kg`)
  }
  const gGKg = Math.max(GRASAS_MIN_GKG, grasasGKg ?? GRASAS_DEFECTO_GKG)
  const proteinaG = Math.round(pGKg * pesoKg)
  const grasasG = Math.round(gGKg * pesoKg)
  const restoKcal = kcal - proteinaG * KCAL_G.proteina - grasasG * KCAL_G.grasas
  const carbosG = Math.max(0, Math.round(restoKcal / KCAL_G.carbos))
  const total = proteinaG * 4 + carbosG * 4 + grasasG * 9 || 1
  return {
    proteinaG,
    grasasG,
    carbosG,
    proteinaGKg: pGKg,
    grasasGKg: gGKg,
    carbosInsuficientes: restoKcal < 0,
    pct: {
      proteina: Math.round(((proteinaG * 4) / total) * 100),
      carbos: Math.round(((carbosG * 4) / total) * 100),
      grasas: Math.round(((grasasG * 9) / total) * 100),
    },
  }
}

/** Reparto por defecto según 3 o 4 comidas, con o sin colaciones. Siempre suma 100 %. */
export function repartoInicial(comidas: 3 | 4, colaciones: boolean): ComidaReparto[] {
  const c = (id: string, nombre: string, pct: number): ComidaReparto => ({ id, nombre, pct })
  if (comidas === 3) {
    return colaciones
      ? [c('desayuno', 'Desayuno', 25), c('almuerzo', 'Almuerzo', 35), c('cena', 'Cena', 30), c('colaciones', 'Colaciones', 10)]
      : [c('desayuno', 'Desayuno', 30), c('almuerzo', 'Almuerzo', 40), c('cena', 'Cena', 30)]
  }
  return colaciones
    ? [
        c('desayuno', 'Desayuno', 20),
        c('almuerzo', 'Almuerzo', 30),
        c('once', 'Once', 15),
        c('cena', 'Cena', 25),
        c('colaciones', 'Colaciones', 10),
      ]
    : [c('desayuno', 'Desayuno', 25), c('almuerzo', 'Almuerzo', 35), c('once', 'Once', 15), c('cena', 'Cena', 25)]
}

export interface ComidaConKcal extends ComidaReparto {
  kcal: number
}

export function repartoPorComida(kcal: number, comidas: ComidaReparto[]): ComidaConKcal[] {
  const suma = comidas.reduce((s, c) => s + c.pct, 0)
  if (Math.abs(suma - 100) > 0.01) {
    throw new RangeError(`El reparto debe sumar 100 % (ahora suma ${suma} %)`)
  }
  return comidas.map((c) => ({ ...c, kcal: Math.round((kcal * c.pct) / 100) }))
}
