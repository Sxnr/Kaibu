// Agua del día (RF-25): se suma o resta de a un vaso; la meta sale de RN-14 o del usuario.

export const AGUA_MAX_ML = 10000
export const VASO_MIN_ML = 100
export const VASO_MAX_ML = 1000
export const VASO_INICIAL_ML = 250

export const sumarVaso = (actualMl: number, vasoMl: number): number => Math.min(AGUA_MAX_ML, actualMl + vasoMl)
export const restarVaso = (actualMl: number, vasoMl: number): number => Math.max(0, actualMl - vasoMl)

export const vasoValido = (ml: number): boolean => Number.isInteger(ml) && ml >= VASO_MIN_ML && ml <= VASO_MAX_ML

export interface AvanceAgua {
  /** 0 a 100 (para la barra). */
  porcentaje: number
  cumplida: boolean
  faltanMl: number
}

export function avanceAgua(ml: number, metaMl: number): AvanceAgua {
  if (metaMl <= 0) return { porcentaje: 0, cumplida: false, faltanMl: 0 }
  return {
    porcentaje: Math.min(100, Math.round((ml / metaMl) * 100)),
    cumplida: ml >= metaMl,
    faltanMl: Math.max(0, metaMl - ml),
  }
}
