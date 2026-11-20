// Lista de compras a partir de lo planificado (lógica pura).
import type { Ingrediente } from './receta'

export interface ItemPlanificado {
  alimentoClave: string | null
  nombre: string
  gramos: number | null
}

export interface RecetaCompras {
  /** Clave del alimento que representa la receta ("mio:<id>"). */
  alimentoClave: string
  porciones: number
  ingredientes: readonly Ingrediente[]
}

export interface ItemCompra {
  clave: string
  nombre: string
  gramos: number
}

/**
 * Suma lo que hay que comprar: las porciones de una receta se convierten en sus ingredientes
 * (en proporción a los gramos comidos); el resto se suma tal cual. Sin gramos, no se cuenta.
 */
export function listaCompras(items: readonly ItemPlanificado[], recetas: readonly RecetaCompras[]): ItemCompra[] {
  const porClave = new Map(recetas.map((r) => [r.alimentoClave, r]))
  const total = new Map<string, ItemCompra>()
  const sumar = (clave: string, nombre: string, gramos: number) => {
    const previo = total.get(clave)
    total.set(clave, { clave, nombre: previo?.nombre ?? nombre, gramos: (previo?.gramos ?? 0) + gramos })
  }
  for (const item of items) {
    if (!item.gramos || item.gramos <= 0) continue
    const receta = item.alimentoClave ? porClave.get(item.alimentoClave) : undefined
    if (receta) {
      const totalG = receta.ingredientes.reduce((s, i) => s + i.gramos, 0)
      if (totalG <= 0) continue
      for (const ing of receta.ingredientes) sumar(ing.clave, ing.nombre, (ing.gramos * item.gramos) / totalG)
    } else {
      sumar(item.alimentoClave ?? `nombre:${item.nombre.toLowerCase()}`, item.nombre, item.gramos)
    }
  }
  return [...total.values()].map((i) => ({ ...i, gramos: Math.round(i.gramos) })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
