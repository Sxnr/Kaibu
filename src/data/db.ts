// Base de datos del dispositivo (IndexedDB con Dexie). Es la fuente que lee la interfaz:
// así la app funciona sin conexión y luego sincroniza con Supabase.
import Dexie, { type EntityTable } from 'dexie'
import type { ActividadDiaria, ComidaReparto, Objetivo, Sexo, Velocidad } from '@/domain/calc/types'
import type { OrigenAlimento } from '@/domain/alimentos/tipos'

export type Tema = 'claro' | 'oscuro' | 'sistema'

interface Sincronizable {
  /** ISO 8601. Lo actualiza la app al escribir y el servidor al guardar. */
  updatedAt: string
  /** Borrado suave: permite sincronizar borrados hechos sin conexión. */
  deletedAt: string | null
}

export interface Perfil extends Sincronizable {
  userId: string
  nombre: string
  sexo: Sexo | null
  fechaNacimiento: string | null
  estaturaCm: number | null
  actividad: ActividadDiaria | null
  diasEntrenamiento: number | null
  objetivo: Objetivo | null
  velocidad: Velocidad | null
  pesoInicial: number | null
  pesoMeta: number | null
  numComidas: 3 | 4 | null
  colaciones: boolean
  comidas: ComidaReparto[]
  kcalManual: number | null
  proteinaGKg: number | null
  aguaMetaMl: number | null
  tema: Tema
  faseInicio: string | null
  onboardingCompleto: boolean
}

export interface RegistroComida extends Sincronizable {
  id: string
  userId: string
  fecha: string
  comida: string
  nombre: string
  origen: OrigenAlimento
  alimentoClave: string | null
  gramos: number | null
  cantidad: number
  unidad: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  createdAt: string
}

export interface MiAlimento extends Sincronizable {
  id: string
  userId: string
  nombre: string
  marca: string | null
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcionNombre: string | null
  porcionG: number | null
  createdAt: string
}

export interface Favorito extends Sincronizable {
  userId: string
  alimentoClave: string
}

export interface Peso extends Sincronizable {
  userId: string
  fecha: string
  kg: number
}

export type TipoConsentimiento = 'terminos' | 'datos_salud'

export interface Consentimiento extends Sincronizable {
  id: string
  userId: string
  tipo: TipoConsentimiento
  version: string
  aceptadoEn: string
}

/** Cambio local pendiente de subir a Supabase. */
export interface Pendiente {
  seq?: number
  tabla: NombreTabla
  /** Clave primaria serializada. */
  clave: string
}

export interface Meta {
  clave: string
  valor: string
}

export type NombreTabla = 'perfiles' | 'registros' | 'misAlimentos' | 'favoritos' | 'pesos' | 'consentimientos'

export class KaibuDB extends Dexie {
  perfiles!: EntityTable<Perfil, 'userId'>
  registros!: EntityTable<RegistroComida, 'id'>
  misAlimentos!: EntityTable<MiAlimento, 'id'>
  favoritos!: Dexie.Table<Favorito, [string, string]>
  pesos!: Dexie.Table<Peso, [string, string]>
  consentimientos!: EntityTable<Consentimiento, 'id'>
  pendientes!: EntityTable<Pendiente, 'seq'>
  meta!: EntityTable<Meta, 'clave'>

  constructor(nombre = 'kaibu') {
    super(nombre)
    this.version(1).stores({
      perfiles: 'userId',
      registros: 'id, [userId+fecha], userId',
      misAlimentos: 'id, userId',
      favoritos: '[userId+alimentoClave], userId',
      pesos: '[userId+fecha], userId',
      consentimientos: 'id, userId',
      pendientes: '++seq, [tabla+clave]',
      meta: 'clave',
    })
  }
}

export const db = new KaibuDB()

export const ahoraISO = (): string => new Date().toISOString()

export const nuevoId = (): string => crypto.randomUUID()

export const activo = <T extends { deletedAt: string | null }>(fila: T | undefined): fila is T =>
  !!fila && fila.deletedAt === null
