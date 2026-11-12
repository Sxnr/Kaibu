// Productos con marca de Chile (Open Food Facts, ODbL) y comida del mundo y cadenas (USDA).
// Pesan ~1 MB: se cargan solo al entrar a Agregar.
import { useEffect, useState } from 'react'
import type { Alimento } from '@/domain/alimentos/tipos'

interface ProductoOff {
  id: string
  nombre: string
  marca?: string
  categoria: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcion: { nombre: string; g: number }
  fuente: string
  alias: string[]
  codigo?: string
}

let cache: Promise<Alimento[]> | null = null

export function cargarProductos(): Promise<Alimento[]> {
  cache ??= Promise.all([import('./productos-cl.json'), import('./mundo.json')]).then(([chile, mundo]) =>
    [...(chile.default as ProductoOff[]), ...(mundo.default as ProductoOff[])].map((p) => ({
      clave: `catalogo:${p.id}`,
      origen: 'catalogo' as const,
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,
      kcal: p.kcal,
      proteina: p.proteina,
      carbos: p.carbos,
      grasas: p.grasas,
      porcion: p.porcion,
      fuente: p.fuente,
      alias: p.alias,
      codigo: p.codigo ?? null,
    })),
  )
  return cache
}

/** Productos con marca (lista vacía mientras cargan o si falla la descarga). */
export function useProductos(): Alimento[] {
  const [productos, setProductos] = useState<Alimento[]>([])
  useEffect(() => {
    let vivo = true
    cargarProductos()
      .then((p) => vivo && setProductos(p))
      .catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [])
  return productos
}
