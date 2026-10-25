// Construcción de registros de comida (lógica pura, separada de la interfaz).
import { ahoraISO, nuevoId, type RegistroComida } from '@/data/db'
import { nutrientesPorGramos } from '@/domain/calc/dia'
import type { Alimento } from '@/domain/alimentos/tipos'
import { formatoNumero } from '@/domain/format/formato'

export type ModoCantidad = 'g' | 'porcion'

export function gramosDe(alimento: Alimento, modo: ModoCantidad, cantidad: number): number {
  return modo === 'porcion' && alimento.porcion ? cantidad * alimento.porcion.g : cantidad
}

export function textoUnidad(alimento: Alimento, modo: ModoCantidad, cantidad: number): string {
  const g = gramosDe(alimento, modo, cantidad)
  if (modo === 'porcion' && alimento.porcion) {
    const base = cantidad === 1 ? alimento.porcion.nombre : `${formatoNumero(cantidad, cantidad % 1 ? 1 : 0)} × ${alimento.porcion.nombre}`
    return `${base} (${formatoNumero(g, g % 1 ? 1 : 0)} g)`
  }
  return `${formatoNumero(g, g % 1 ? 1 : 0)} g`
}

interface Datos {
  userId: string
  fecha: string
  comida: string
  alimento: Alimento
  modo: ModoCantidad
  cantidad: number
}

export function nuevoRegistro({ userId, fecha, comida, alimento, modo, cantidad }: Datos): RegistroComida {
  const gramos = gramosDe(alimento, modo, cantidad)
  const n = nutrientesPorGramos(alimento, gramos)
  const ahora = ahoraISO()
  return {
    id: nuevoId(),
    userId,
    fecha,
    comida,
    nombre: alimento.nombre,
    origen: alimento.origen,
    alimentoClave: alimento.clave,
    gramos: Math.round(gramos * 10) / 10,
    cantidad,
    unidad: textoUnidad(alimento, modo, cantidad),
    ...n,
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  }
}

export function registroRapido(userId: string, fecha: string, comida: string, kcal: number, proteina: number, nombre?: string): RegistroComida {
  const ahora = ahoraISO()
  return {
    id: nuevoId(),
    userId,
    fecha,
    comida,
    nombre: nombre?.trim() || 'Agregado rápido',
    origen: 'rapido',
    alimentoClave: null,
    gramos: null,
    cantidad: 1,
    unidad: 'Porción',
    kcal: Math.round(kcal),
    proteina: Math.round(proteina * 10) / 10,
    carbos: 0,
    grasas: 0,
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  }
}

/** Copia registros a otra fecha/comida (nuevos ids). */
export function copiarRegistros(registros: RegistroComida[], fecha: string, comida?: string): RegistroComida[] {
  const ahora = ahoraISO()
  return registros.map((r, i) => ({
    ...r,
    id: nuevoId(),
    fecha,
    comida: comida ?? r.comida,
    // Mantiene el orden original dentro de la comida
    createdAt: new Date(Date.parse(ahora) + i).toISOString(),
    updatedAt: ahora,
    deletedAt: null,
  }))
}

/** Comida sugerida según la hora del día. */
export function comidaSegunHora(ids: string[], hora = new Date().getHours()): string {
  const tiene = (id: string) => ids.includes(id)
  if (hora < 11 && tiene('desayuno')) return 'desayuno'
  if (hora < 16 && tiene('almuerzo')) return 'almuerzo'
  if (hora < 20 && tiene('once')) return 'once'
  if (tiene('cena')) return 'cena'
  return ids[0] ?? 'desayuno'
}
