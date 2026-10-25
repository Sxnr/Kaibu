// Totales del día y de la semana a partir de los registros (sin interfaz, fácil de probar).
import type { RegistroComida } from '@/data/db'
import { calcularRacha, estadoDia, sumarNutrientes, type EstadoDia, type Nutrientes } from '@/domain/calc/dia'
import type { ComidaReparto } from '@/domain/calc/types'

export interface ResumenComida extends ComidaReparto {
  registros: RegistroComida[]
  total: Nutrientes
}

export function resumenPorComida(registros: RegistroComida[], comidas: ComidaReparto[]): ResumenComida[] {
  const conocidas = new Set(comidas.map((c) => c.id))
  const lista = comidas.map((c) => {
    const deEsta = registros.filter((r) => r.comida === c.id)
    return { ...c, registros: deEsta, total: sumarNutrientes(deEsta) }
  })
  // Registros de comidas que ya no están configuradas (p. ej. se pasó de 4 a 3 comidas).
  const huerfanos = registros.filter((r) => !conocidas.has(r.comida))
  if (huerfanos.length > 0) lista.push({ id: 'otras', nombre: 'Otras', pct: 0, registros: huerfanos, total: sumarNutrientes(huerfanos) })
  return lista
}

/** Estado por fecha (cumplido, fuera, sin registro) según la meta. */
export function estadosPorFecha(registros: RegistroComida[], meta: number): Record<string, EstadoDia> {
  const porFecha = new Map<string, RegistroComida[]>()
  for (const r of registros) porFecha.set(r.fecha, [...(porFecha.get(r.fecha) ?? []), r])
  const estados: Record<string, EstadoDia> = {}
  for (const [fecha, lista] of porFecha) {
    estados[fecha] = estadoDia({ kcal: sumarNutrientes(lista).kcal, meta, registros: lista.length })
  }
  return estados
}

export function rachaActual(registros: RegistroComida[], meta: number, hoy: string): number {
  return calcularRacha(estadosPorFecha(registros, meta), hoy)
}
