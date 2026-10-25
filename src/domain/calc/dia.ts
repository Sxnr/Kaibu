// Estado del día, racha y cálculos de alimentos.
import { sumarDias } from '../format/formato'
import { rangoAceptable } from './energia'

export type EstadoDia = 'cumplido' | 'fuera' | 'sin_registro'

export function estadoDia({ kcal, meta, registros }: { kcal: number; meta: number; registros: number }): EstadoDia {
  if (registros === 0) return 'sin_registro'
  const { min, max } = rangoAceptable(meta)
  return kcal >= min && kcal <= max ? 'cumplido' : 'fuera'
}

/**
 * Racha: días cumplidos seguidos hasta ayer. Hoy suma solo si ya está cumplido
 * (hoy sin cumplir no rompe la racha, porque el día aún no termina).
 */
export function calcularRacha(estados: Readonly<Record<string, EstadoDia>>, hoy: string): number {
  let racha = estados[hoy] === 'cumplido' ? 1 : 0
  let dia = sumarDias(hoy, -1)
  while (estados[dia] === 'cumplido') {
    racha++
    dia = sumarDias(dia, -1)
  }
  return racha
}

export interface Nutrientes {
  kcal: number
  proteina: number
  carbos: number
  grasas: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Escala valores por 100 g a una cantidad en gramos. */
export function nutrientesPorGramos(por100: Nutrientes, gramos: number): Nutrientes {
  const f = gramos / 100
  return {
    kcal: Math.round(por100.kcal * f),
    proteina: r1(por100.proteina * f),
    carbos: r1(por100.carbos * f),
    grasas: r1(por100.grasas * f),
  }
}

export function sumarNutrientes(lista: Nutrientes[]): Nutrientes {
  return lista.reduce<Nutrientes>(
    (t, n) => ({
      kcal: t.kcal + n.kcal,
      proteina: r1(t.proteina + n.proteina),
      carbos: r1(t.carbos + n.carbos),
      grasas: r1(t.grasas + n.grasas),
    }),
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 },
  )
}

/** Comprueba que kcal ≈ 4·P + 4·C + 9·G dentro del margen (por defecto ±15 %). */
export function validarCoherenciaKcal(n: Nutrientes, margen = 0.15): boolean {
  const calculadas = n.proteina * 4 + n.carbos * 4 + n.grasas * 9
  if (n.kcal === 0) return calculadas < 5
  return Math.abs(calculadas - n.kcal) / n.kcal <= margen
}
