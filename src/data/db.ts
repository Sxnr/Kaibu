// Base de datos del dispositivo (IndexedDB con Dexie). Es la fuente que lee la interfaz:
// así la app funciona sin conexión y luego sincroniza con Supabase.
import Dexie, { type EntityTable } from 'dexie'
import type { ActividadDiaria, ComidaReparto, Objetivo, Sexo, Velocidad } from '@/domain/calc/types'
import type { OrigenAlimento } from '@/domain/alimentos/tipos'
import type { TipoEvento } from '@/domain/calc/semana'
import type { EstadoReporte, TipoReporte } from '@/domain/comunidad/reportes'

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
  /** Tamaño del vaso para "+ 1 vaso" (ml). */
  vasoMl: number
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

/** Evento que ocurre una sola vez (ajuste semanal, aviso, día terminado, celebración…). */
export interface Evento extends Sincronizable {
  userId: string
  tipo: TipoEvento
  clave: string
  valor: string | null
  fecha: string
}

/** Lo que se anota una vez por día: agua (RF-25) y nota (RF-27). */
export interface DiaRegistro extends Sincronizable {
  userId: string
  fecha: string
  aguaMl: number
  nota: string | null
}

/** Reporte de un problema o sugerencia enviado al Discord de Kaibu (tabla app_feedback). */
export interface Reporte extends Sincronizable {
  id: string
  userId: string
  tipo: TipoReporte
  titulo: string | null
  descripcion: string
  plataforma: string
  versionApp: string
  sinConexion: boolean
  /** Lo actualiza el bot de Discord (publicado, en arreglo, resuelto…). */
  estado: EstadoReporte
  createdAt: string
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

/** Producto aportado a la comunidad desde la etiqueta (tabla community_foods). Valores por 100 g. */
export interface Aporte extends Sincronizable {
  id: string
  userId: string
  codigo: string | null
  nombre: string
  marca: string | null
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcionNombre: string | null
  porcionG: number | null
  /** Los calcula el servidor con los votos; la app no los sube. */
  confirmaciones: number
  reportes: number
  estado: 'nuevo' | 'verificado' | 'oculto'
  createdAt: string
}

/** Voto sobre un aporte de otra persona (tabla community_food_votes). */
export interface Voto extends Sincronizable {
  foodId: string
  userId: string
  voto: 'confirma' | 'reporta'
}

/** Producto encontrado por código en Open Food Facts (se guarda para que recientes y favoritos lo encuentren). */
export interface Externo {
  clave: string
  codigo: string
  nombre: string
  marca: string | null
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcionNombre: string | null
  porcionG: number | null
  fuente: string
  guardadoEn: string
}

export type NombreTabla =
  | 'perfiles'
  | 'registros'
  | 'misAlimentos'
  | 'favoritos'
  | 'pesos'
  | 'consentimientos'
  | 'eventos'
  | 'dias'
  | 'reportes'
  | 'aportes'
  | 'votos'

export class KaibuDB extends Dexie {
  perfiles!: EntityTable<Perfil, 'userId'>
  registros!: EntityTable<RegistroComida, 'id'>
  misAlimentos!: EntityTable<MiAlimento, 'id'>
  favoritos!: Dexie.Table<Favorito, [string, string]>
  pesos!: Dexie.Table<Peso, [string, string]>
  consentimientos!: EntityTable<Consentimiento, 'id'>
  eventos!: Dexie.Table<Evento, [string, string, string]>
  dias!: Dexie.Table<DiaRegistro, [string, string]>
  reportes!: EntityTable<Reporte, 'id'>
  aportes!: EntityTable<Aporte, 'id'>
  votos!: Dexie.Table<Voto, [string, string]>
  /** Aportes de toda la comunidad (copia para buscar sin conexión). */
  comunidad!: EntityTable<Aporte, 'id'>
  externos!: EntityTable<Externo, 'clave'>
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
    // Etapa 2: eventos del usuario.
    this.version(2).stores({
      eventos: '[userId+tipo+clave], userId',
    })
    // Sprint 2: registro del día (agua y nota) y tamaño del vaso en el perfil.
    this.version(3)
      .stores({ dias: '[userId+fecha], userId' })
      .upgrade((tx) =>
        tx
          .table('perfiles')
          .toCollection()
          .modify((p: Partial<Perfil>) => {
            p.vasoMl ??= 250
          }),
      )
    // Comunidad: reportes y sugerencias enviados al Discord de Kaibu.
    this.version(4).stores({ reportes: 'id, userId' })
    // Catálogo colaborativo: mis aportes y votos (se sincronizan), la copia de la comunidad y lo encontrado por código.
    this.version(5).stores({
      aportes: 'id, userId, codigo',
      votos: '[foodId+userId], userId',
      comunidad: 'id, codigo',
      externos: 'clave, codigo',
    })
  }
}

export const db = new KaibuDB()

export const ahoraISO = (): string => new Date().toISOString()

export const nuevoId = (): string => crypto.randomUUID()

export const activo = <T extends { deletedAt: string | null }>(fila: T | undefined): fila is T =>
  !!fila && fila.deletedAt === null
