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
  /** Código de barras (EAN/UPC), si se conoce. */
  codigo?: string | null
  /** Si es un aporte de la comunidad: quién lo aportó y cómo va su verificación. */
  comunidad?: { id: string; userId: string; estado: 'nuevo' | 'verificado' | 'oculto'; confirmaciones: number; reportes: number }
}

export interface AlimentoCatalogo extends Nutrientes {
  id: string
  nombre: string
  categoria: string
  porcion: Porcion
  fuente: string
  alias: string[]
}
