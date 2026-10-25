import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type Peso, type RegistroComida } from './db'
import { borrar, guardar } from './escritura'
import { bajarCambios, sincronizar, subirPendientes, type Remoto } from './sync'

type Fila = Record<string, unknown>

/** Servidor falso en memoria que imita a Supabase (updated_at lo pone el servidor). */
function servidorFalso() {
  const tablas = new Map<string, Map<string, Fila>>()
  let reloj = Date.parse('2026-10-25T00:00:00Z')
  const tabla = (n: string) => tablas.get(n) ?? tablas.set(n, new Map()).get(n)!
  const remoto: Remoto = {
    async upsert(n, filas, conflicto) {
      for (const f of filas) {
        const clave = conflicto.split(',').map((c) => f[c]).join('|')
        tabla(n).set(clave, { ...f, updated_at: new Date(++reloj).toISOString() })
      }
    },
    async agregar(n, filas) {
      for (const f of filas) if (!tabla(n).has(String(f.id))) tabla(n).set(String(f.id), { ...f, updated_at: new Date(++reloj).toISOString() })
    },
    async cambiosDesde(n, userId, desde, limite) {
      return [...tabla(n).values()]
        .filter((f) => f.user_id === userId && (!desde || String(f.updated_at) >= desde))
        .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)))
        .slice(0, limite)
    },
  }
  return { remoto, tabla }
}

const U = '11111111-1111-1111-1111-111111111111'

const registro = (id: string, kcal: number): RegistroComida => ({
  id,
  userId: U,
  fecha: '2026-10-25',
  comida: 'desayuno',
  nombre: 'Huevo',
  origen: 'catalogo',
  alimentoClave: 'catalogo:huevo',
  gramos: 50,
  cantidad: 1,
  unidad: '1 unidad',
  kcal,
  proteina: 6.3,
  carbos: 0.4,
  grasas: 4.8,
  createdAt: '2026-10-25T08:00:00Z',
  updatedAt: '',
  deletedAt: null,
})

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('sincronización', () => {
  it('lo registrado sin conexión queda pendiente y se sube al volver internet', async () => {
    const { remoto, tabla } = servidorFalso()
    await guardar('registros', registro('a', 72))
    await guardar('pesos', { userId: U, fecha: '2026-10-25', kg: 91.1, updatedAt: '', deletedAt: null } satisfies Peso)
    expect(await db.pendientes.count()).toBe(2)

    await subirPendientes(remoto)
    expect(await db.pendientes.count()).toBe(0)
    expect(tabla('food_logs').get('a')).toMatchObject({ user_id: U, kcal: 72, alimento_clave: 'catalogo:huevo' })
    expect(tabla('weights').get(`${U}|2026-10-25`)).toMatchObject({ kg: 91.1 })
  })

  it('baja datos de otro dispositivo', async () => {
    const { remoto } = servidorFalso()
    await remoto.upsert(
      'user_foods',
      [{ id: 'm1', user_id: U, nombre: 'Pan de casa', marca: null, kcal_100: '250', proteina_100: 8, carbos_100: 50, grasas_100: 2, porcion_nombre: null, porcion_g: null, created_at: 'x', deleted_at: null }],
      'id',
    )
    await bajarCambios(remoto, U)
    const local = await db.misAlimentos.get('m1')
    expect(local).toMatchObject({ nombre: 'Pan de casa', kcal: 250, userId: U })
  })

  it('un cambio local pendiente no se pisa con datos del servidor', async () => {
    const { remoto } = servidorFalso()
    await remoto.upsert('food_logs', [{ ...snake(registro('a', 100)) }], 'id')
    await guardar('registros', registro('a', 72)) // editado sin conexión
    await bajarCambios(remoto, U)
    expect((await db.registros.get('a'))?.kcal).toBe(72)
    await sincronizar(remoto, U)
    expect((await db.registros.get('a'))?.kcal).toBe(72)
  })

  it('los borrados sin conexión también se sincronizan', async () => {
    const { remoto, tabla } = servidorFalso()
    const r = await guardar('registros', registro('a', 72))
    await sincronizar(remoto, U)
    await borrar('registros', r)
    await sincronizar(remoto, U)
    expect(tabla('food_logs').get('a')?.deleted_at).toBeTruthy()
  })

  it('en modo local no se encola nada', async () => {
    await guardar('registros', { ...registro('b', 10), userId: 'local' })
    expect(await db.pendientes.count()).toBe(0)
  })
})

function snake(r: RegistroComida): Fila {
  return {
    id: r.id,
    user_id: r.userId,
    fecha: r.fecha,
    comida: r.comida,
    nombre: r.nombre,
    origen: r.origen,
    alimento_clave: r.alimentoClave,
    gramos: r.gramos,
    cantidad: r.cantidad,
    unidad: r.unidad,
    kcal: r.kcal,
    proteina: r.proteina,
    carbos: r.carbos,
    grasas: r.grasas,
    created_at: r.createdAt,
    deleted_at: r.deletedAt,
  }
}
