// Tipos de alimentos (catálogo, mis alimentos y registro rápido).
import type { Nutrientes } from '../calc/dia'

export type OrigenAlimento = 'catalogo' | 'mio' | 'rapido'

export interface Porcion {
  nombre: string
  g: number
}

/** Alimento listo para buscar y registrar. Valores nutricionales por 100 g. */
export interface Alimento extends Nutrientes {
  /** Clave única global: "catalogo:huevo" o "mio:<uuid>". */
  clave: string
  origen: OrigenAlimento
  nombre: string
  marca?: string | null
  categoria?: string
  porcion?: Porcion | null
  fuente?: string
  alias?: string[]
}

export interface AlimentoCatalogo extends Nutrientes {
  id: string
  nombre: string
  categoria: string
  porcion: Porcion
  fuente: string
  alias: string[]
}
