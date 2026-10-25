// Catálogo inicial de alimentos genéricos comunes en Chile (no son registros del usuario).
import type { Alimento, AlimentoCatalogo } from '@/domain/alimentos/tipos'
import datos from './catalogo-cl.json'

export const CATALOGO: AlimentoCatalogo[] = datos as AlimentoCatalogo[]

export const ALIMENTOS_CATALOGO: Alimento[] = CATALOGO.map((a) => ({
  clave: `catalogo:${a.id}`,
  origen: 'catalogo',
  nombre: a.nombre,
  categoria: a.categoria,
  kcal: a.kcal,
  proteina: a.proteina,
  carbos: a.carbos,
  grasas: a.grasas,
  porcion: a.porcion,
  fuente: a.fuente,
  alias: a.alias,
}))
