// Plan del usuario calculado en vivo: se recalcula solo cuando cambian el perfil o el peso promedio.
import { useMemo } from 'react'
import type { Perfil, Peso } from '@/data/db'
import { calcularPlan, type PlanCalculado } from '@/domain/calc/plan'
import { promedioMovil7 } from '@/domain/calc/peso'

/** Peso de referencia: promedio de 7 días del último registro; si no hay, el peso inicial. */
export function pesoReferencia(perfil: Perfil | null | undefined, pesos: Peso[] | undefined): number | null {
  const serie = promedioMovil7((pesos ?? []).map((p) => ({ fecha: p.fecha, kg: p.kg })))
  return serie.at(-1)?.promedio ?? perfil?.pesoInicial ?? null
}

export function planDesdePerfil(perfil: Perfil, pesoKg: number): PlanCalculado | null {
  if (
    !perfil.sexo ||
    !perfil.fechaNacimiento ||
    !perfil.estaturaCm ||
    !perfil.actividad ||
    perfil.diasEntrenamiento === null ||
    !perfil.objetivo ||
    !perfil.velocidad ||
    perfil.comidas.length === 0
  ) {
    return null
  }
  try {
    return calcularPlan({
      sexo: perfil.sexo,
      fechaNacimiento: perfil.fechaNacimiento,
      estaturaCm: perfil.estaturaCm,
      pesoKg,
      actividad: perfil.actividad,
      diasEntrenamiento: perfil.diasEntrenamiento,
      objetivo: perfil.objetivo,
      velocidad: perfil.velocidad,
      comidas: perfil.comidas,
      proteinaGKg: perfil.proteinaGKg ?? undefined,
      kcalManual: perfil.kcalManual,
    })
  } catch {
    return null
  }
}

export function usePlan(perfil: Perfil | null | undefined, pesos: Peso[] | undefined) {
  return useMemo(() => {
    if (!perfil) return { plan: null, pesoKg: null }
    const pesoKg = pesoReferencia(perfil, pesos)
    if (!pesoKg) return { plan: null, pesoKg: null }
    const plan = planDesdePerfil(perfil, pesoKg)
    if (plan && perfil.aguaMetaMl) plan.aguaMl = perfil.aguaMetaMl
    return { plan, pesoKg }
  }, [perfil, pesos])
}
