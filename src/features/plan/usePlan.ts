// Plan del usuario calculado en vivo: se recalcula solo cuando cambian el perfil o el peso promedio.
import { useMemo } from 'react'
import type { Evento, Perfil, Peso } from '@/data/db'
import { hoyISO } from '@/domain/format/formato'
import { calcularPlan, type PlanCalculado } from '@/domain/calc/plan'
import { promedioMovil7 } from '@/domain/calc/peso'
import { ajusteVigente } from '@/domain/calc/semana'

/** Peso de referencia: promedio de 7 días del último registro; si no hay, el peso inicial. */
export function pesoReferencia(perfil: Perfil | null | undefined, pesos: Peso[] | undefined): number | null {
  const serie = promedioMovil7((pesos ?? []).map((p) => ({ fecha: p.fecha, kg: p.kg })))
  return serie.at(-1)?.promedio ?? perfil?.pesoInicial ?? null
}

export function planDesdePerfil(perfil: Perfil, pesoKg: number, ajusteKcal = 0): PlanCalculado | null {
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
      ajusteKcal,
    })
  } catch {
    return null
  }
}

/** Plan del día. Con los eventos, suma los ajustes semanales aceptados que ya rigen. */
export function usePlan(perfil: Perfil | null | undefined, pesos: Peso[] | undefined, eventos?: Evento[]) {
  return useMemo(() => {
    if (!perfil) return { plan: null, pesoKg: null, ajuste: 0 }
    const pesoKg = pesoReferencia(perfil, pesos)
    if (!pesoKg) return { plan: null, pesoKg: null, ajuste: 0 }
    const ajuste = eventos ? ajusteVigente(eventos, hoyISO(), perfil.faseInicio) : 0
    const plan = planDesdePerfil(perfil, pesoKg, ajuste)
    if (plan && perfil.aguaMetaMl) plan.aguaMl = perfil.aguaMetaMl
    return { plan, pesoKg, ajuste }
  }, [perfil, pesos, eventos])
}
