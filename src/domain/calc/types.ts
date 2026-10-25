// Tipos del dominio de cálculos (sin dependencias de la interfaz).

export type Sexo = 'hombre' | 'mujer'

/** Actividad diaria SIN contar el gym. */
export type ActividadDiaria = 'sedentario' | 'ligero' | 'activo'

export type Objetivo = 'perder' | 'mantener' | 'ganar'

export type Velocidad = 'lenta' | 'recomendada' | 'rapida'

/** Niveles de la tabla de factores de actividad (Mifflin-St Jeor). */
export type NivelFactor = 'sedentario' | 'ligero' | 'moderado' | 'alto' | 'muy_alto'

export interface ComidaReparto {
  id: string
  nombre: string
  /** Porcentaje de las kcal del día (0–100). */
  pct: number
}

export interface RegistroPeso {
  /** Fecha local en formato AAAA-MM-DD. */
  fecha: string
  kg: number
}

export interface Macros {
  proteinaG: number
  grasasG: number
  carbosG: number
}
