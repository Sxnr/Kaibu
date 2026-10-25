// Correspondencia entre las tablas del dispositivo (Dexie) y las de Supabase.
import type { Table } from 'dexie'
import { db, type NombreTabla } from './db'

type Fila = Record<string, unknown>

export interface ConfigTabla {
  remota: string
  /** Columnas que forman la clave única en Supabase (para upsert). */
  conflicto: string
  /** Solo se agregan filas (nunca se modifican), p. ej. consentimientos. */
  soloAgregar?: boolean
  local: () => Table
  /** Clave primaria local de una fila, serializada como texto. */
  clave: (fila: Fila) => string
  /** Valor de clave primaria de Dexie a partir del texto serializado. */
  claveDexie: (clave: string) => string | [string, string]
  aRemota: (fila: Fila) => Fila
  aLocal: (fila: Fila) => Fila
}

const aSnake = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
const aCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/** Convierte las claves de un objeto, con renombres específicos opcionales. */
function convertir(fila: Fila, fn: (s: string) => string, renombres: Record<string, string> = {}): Fila {
  const salida: Fila = {}
  for (const [k, v] of Object.entries(fila)) salida[renombres[k] ?? fn(k)] = v
  return salida
}

const NUMERICOS = new Set([
  'estaturaCm',
  'pesoInicial',
  'pesoMeta',
  'proteinaGKg',
  'gramos',
  'cantidad',
  'kcal',
  'proteina',
  'carbos',
  'grasas',
  'kg',
  'porcionG',
])

/** PostgREST puede devolver "numeric" como texto: lo normalizamos a número. */
function normalizarNumeros(fila: Fila): Fila {
  for (const k of Object.keys(fila)) {
    const v = fila[k]
    if (NUMERICOS.has(k) && typeof v === 'string') fila[k] = Number(v)
  }
  return fila
}

const ALIMENTO_LOCAL_A_REMOTO = {
  kcal: 'kcal_100',
  proteina: 'proteina_100',
  carbos: 'carbos_100',
  grasas: 'grasas_100',
}
const ALIMENTO_REMOTO_A_LOCAL = Object.fromEntries(Object.entries(ALIMENTO_LOCAL_A_REMOTO).map(([a, b]) => [b, a]))

const RENOMBRE_PERFIL_A_REMOTO = { proteinaGKg: 'proteina_gkg' }
const RENOMBRE_PERFIL_A_LOCAL = { proteina_gkg: 'proteinaGKg' }

function aRemotaBase(fila: Fila, renombres: Record<string, string> = {}): Fila {
  return convertir(fila, aSnake, renombres)
}
function aLocalBase(fila: Fila, renombres: Record<string, string> = {}): Fila {
  return normalizarNumeros(convertir(fila, aCamel, renombres))
}

export const TABLAS: Record<NombreTabla, ConfigTabla> = {
  perfiles: {
    remota: 'profiles',
    conflicto: 'user_id',
    local: () => db.perfiles,
    clave: (f) => String(f.userId),
    claveDexie: (c) => c,
    aRemota: (f) => {
      const r = aRemotaBase(f, RENOMBRE_PERFIL_A_REMOTO)
      delete r.created_at
      return r
    },
    aLocal: (f) => {
      const l = aLocalBase(f, RENOMBRE_PERFIL_A_LOCAL)
      delete l.createdAt
      return l
    },
  },
  registros: {
    remota: 'food_logs',
    conflicto: 'id',
    local: () => db.registros,
    clave: (f) => String(f.id),
    claveDexie: (c) => c,
    aRemota: (f) => aRemotaBase(f),
    aLocal: (f) => aLocalBase(f),
  },
  misAlimentos: {
    remota: 'user_foods',
    conflicto: 'id',
    local: () => db.misAlimentos,
    clave: (f) => String(f.id),
    claveDexie: (c) => c,
    aRemota: (f) => aRemotaBase(f, ALIMENTO_LOCAL_A_REMOTO),
    aLocal: (f) => aLocalBase(f, ALIMENTO_REMOTO_A_LOCAL),
  },
  favoritos: {
    remota: 'favorites',
    conflicto: 'user_id,alimento_clave',
    local: () => db.favoritos,
    clave: (f) => JSON.stringify([f.userId, f.alimentoClave]),
    claveDexie: (c) => JSON.parse(c) as [string, string],
    aRemota: (f) => aRemotaBase(f),
    aLocal: (f) => {
      const l = aLocalBase(f)
      delete l.createdAt
      return l
    },
  },
  pesos: {
    remota: 'weights',
    conflicto: 'user_id,fecha',
    local: () => db.pesos,
    clave: (f) => JSON.stringify([f.userId, f.fecha]),
    claveDexie: (c) => JSON.parse(c) as [string, string],
    aRemota: (f) => aRemotaBase(f),
    aLocal: (f) => {
      const l = aLocalBase(f)
      delete l.createdAt
      return l
    },
  },
  consentimientos: {
    remota: 'consents',
    conflicto: 'id',
    soloAgregar: true,
    local: () => db.consentimientos,
    clave: (f) => String(f.id),
    claveDexie: (c) => c,
    aRemota: (f) => aRemotaBase(f),
    aLocal: (f) => aLocalBase(f),
  },
}

export const ORDEN_TABLAS: NombreTabla[] = ['perfiles', 'consentimientos', 'misAlimentos', 'registros', 'favoritos', 'pesos']
