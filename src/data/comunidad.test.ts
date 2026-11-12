import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Alimento } from '@/domain/alimentos/tipos'
import { alimentosComunidad, bajarComunidad, buscarPorCodigo } from './comunidad'
import { db, type Aporte } from './db'

type Fila = Record<string, unknown>
const YO = '11111111-1111-1111-1111-111111111111'
const OTRA = '22222222-2222-2222-2222-222222222222'

const remota = (id: string, extra: Fila = {}): Fila => ({
  id, user_id: OTRA, codigo: '7802500222189', nombre: 'Spaghetti 5', marca: 'Lucchetti',
  kcal_100: '350.0', proteina_100: '12.0', carbos_100: '72.0', grasas_100: '1.5', porcion_nombre: '1 porción', porcion_g: '80.0',
  confirmaciones: 2, reportes: 0, estado: 'verificado', valores_at: '2026-11-12T10:00:00Z',
  created_at: '2026-11-12T10:00:00Z', updated_at: '2026-11-12T10:00:00Z', deleted_at: null, ...extra,
})

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('bajar la comunidad', () => {
  it('guarda los aportes y la próxima vez solo pide lo nuevo', async () => {
    const pedidos: (string | null)[] = []
    const servidor = [remota('a1'), remota('a2', { updated_at: '2026-11-12T11:00:00Z' })]
    const traer = async (desde: string | null) => {
      pedidos.push(desde)
      return servidor.filter((f) => !desde || String(f.updated_at) > desde)
    }
    expect(await bajarComunidad(traer)).toBe(2)
    expect((await db.comunidad.get('a1'))?.kcal).toBe(350)
    expect(await bajarComunidad(traer)).toBe(0)
    expect(pedidos).toEqual([null, '2026-11-12T11:00:00Z'])
  })
})

describe('aportes como alimentos', () => {
  it('muestra los de todos y los míos sin duplicar, y esconde los ocultos', async () => {
    await db.comunidad.bulkPut([
      { ...aporte('a1', OTRA), estado: 'verificado', confirmaciones: 2 },
      { ...aporte('a2', OTRA), estado: 'oculto', reportes: 3 },
      { ...aporte('m1', YO), nombre: 'Versión vieja' },
    ])
    await db.aportes.put({ ...aporte('m1', YO), nombre: 'Mi aporte' })
    const lista = await alimentosComunidad()
    expect(lista.map((a) => a.nombre).sort()).toEqual(['Mi aporte', 'Spaghetti 5'])
    expect(lista.find((a) => a.clave === 'comunidad:a1')?.comunidad?.estado).toBe('verificado')
  })
})

describe('buscar por código de barras', () => {
  const producto: Alimento = { clave: 'catalogo:off-1', origen: 'catalogo', nombre: 'Leche', kcal: 60, proteina: 3, carbos: 5, grasas: 3, codigo: '7802900000017' }
  const sinOff = async () => null

  it('primero el catálogo de Kaibu', async () => {
    expect((await buscarPorCodigo('7802900000017', [producto], sinOff))?.alimento.clave).toBe('catalogo:off-1')
  })
  it('después la comunidad (si no está oculto)', async () => {
    await db.comunidad.put({ ...aporte('a1', OTRA), codigo: '7802500222189' })
    const r = await buscarPorCodigo('7802500222189', [producto], sinOff)
    expect(r?.origen).toBe('comunidad')
  })
  it('al final Open Food Facts, y lo guarda para la próxima vez', async () => {
    const off = async () => ({
      code: '8000000000002', product_name: 'Galletas', brands: 'Marca', serving_quantity: 30,
      nutriments: { 'energy-kcal_100g': 480, proteins_100g: 6, carbohydrates_100g: 65, fat_100g: 21 },
    })
    const r = await buscarPorCodigo('8000000000002', [producto], off)
    expect(r?.origen).toBe('off')
    expect(r?.alimento.clave).toBe('off:8000000000002')
    expect((await db.externos.get('off:8000000000002'))?.nombre).toBe('Galletas')
    expect((await buscarPorCodigo('8000000000002', [producto], sinOff))?.origen).toBe('off')
  })
  it('si no está en ninguna parte, devuelve null', async () => {
    expect(await buscarPorCodigo('8000000000002', [producto], sinOff)).toBeNull()
  })
})

function aporte(id: string, userId: string): Aporte {
  return {
    id, userId, codigo: null, nombre: 'Spaghetti 5', marca: 'Lucchetti', kcal: 350, proteina: 12, carbos: 72, grasas: 1.5,
    porcionNombre: null, porcionG: null, confirmaciones: 0, reportes: 0, estado: 'nuevo', createdAt: '', updatedAt: '', deletedAt: null,
  }
}
