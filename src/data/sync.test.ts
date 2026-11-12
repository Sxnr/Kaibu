import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type Peso, type RegistroComida } from './db'
import { borrar, guardar } from './escritura'
import { bajarCambios, sincronizar, subirPendientes, type Remoto } from './sync'
import { TABLAS } from './tablas'
import { asegurarPerfilLocal, perfilVacio } from '@/app/consentimiento'

type Fila = Record<string, unknown>

/** Servidor falso en memoria que imita a Supabase (updated_at lo pone el servidor). */
function servidorFalso(rechaza: (tabla: string, fila: Fila) => boolean = () => false) {
  const tablas = new Map<string, Map<string, Fila>>()
  let reloj = Date.parse('2026-10-25T00:00:00Z')
  const tabla = (n: string) => tablas.get(n) ?? tablas.set(n, new Map()).get(n)!
  const remoto: Remoto = {
    async upsert(n, filas, conflicto) {
      // Como Postgres: si una fila viola un CHECK, falla el lote completo.
      if (filas.some((f) => rechaza(n, f))) throw new Error(`${n}: new row violates check constraint`)
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

  it('el perfil vacío de un dispositivo nuevo no se sube ni pisa el perfil del servidor', async () => {
    const { remoto, tabla } = servidorFalso()
    const completo = { ...perfilVacio(U), nombre: 'Francisco', estaturaCm: 175, onboardingCompleto: true }
    await remoto.upsert('profiles', [TABLAS.perfiles.aRemota(completo)], 'user_id')

    // Dispositivo nuevo: la primera sincronización no alcanzó a traer el perfil.
    await asegurarPerfilLocal(U)
    expect((await db.perfiles.get(U))?.onboardingCompleto).toBe(false)
    expect(await db.pendientes.count()).toBe(0)

    await sincronizar(remoto, U)
    expect(tabla('profiles').get(U)?.nombre).toBe('Francisco')
    expect((await db.perfiles.get(U))?.nombre).toBe('Francisco')
    expect((await db.perfiles.get(U))?.onboardingCompleto).toBe(true)
  })

  it('si ya hay un perfil en el dispositivo, no se reemplaza por uno vacío', async () => {
    await db.perfiles.put({ ...perfilVacio(U), nombre: 'Francisco', onboardingCompleto: true })
    await asegurarPerfilLocal(U)
    expect((await db.perfiles.get(U))?.nombre).toBe('Francisco')
  })

  it('recorta la unidad y el nombre a lo que acepta Supabase', async () => {
    const { remoto, tabla } = servidorFalso((n, f) => n === 'food_logs' && String(f.unidad).length > 40)
    await guardar('registros', { ...registro('a', 72), unidad: '1,5 × 1 envase / porción (110g) (110 (165 g)', nombre: 'x'.repeat(150) })
    await subirPendientes(remoto)
    expect(await db.pendientes.count()).toBe(0)
    const subido = tabla('food_logs').get('a')!
    expect(String(subido.unidad).length).toBeLessThanOrEqual(40)
    expect(String(subido.nombre).length).toBeLessThanOrEqual(120)
  })

  it('una fila rechazada no bloquea las demás: queda pendiente y el resto se sube', async () => {
    const { remoto, tabla } = servidorFalso((n, f) => n === 'food_logs' && f.id === 'mala')
    await guardar('registros', registro('a', 72))
    await guardar('registros', registro('mala', 10))
    await guardar('registros', registro('c', 90))
    await guardar('pesos', { userId: U, fecha: '2026-10-25', kg: 91.1, updatedAt: '', deletedAt: null } satisfies Peso)

    const resultado = await sincronizar(remoto, U)
    expect(resultado.subidos).toBe(3)
    expect(tabla('food_logs').has('a')).toBe(true)
    expect(tabla('food_logs').has('c')).toBe(true)
    expect(tabla('weights').get(`${U}|2026-10-25`)).toMatchObject({ kg: 91.1 })
    const pendientes = await db.pendientes.toArray()
    expect(pendientes.map((p) => p.clave)).toEqual(['mala'])
  })

  it('al cambiar de versión vuelve a bajar todo y recupera lo que faltaba en el dispositivo', async () => {
    const { remoto, tabla } = servidorFalso()
    tabla('food_logs').set('a', { ...snake(registro('a', 72)), updated_at: '2026-11-10T10:00:00Z' })
    tabla('food_logs').set('b', { ...snake(registro('b', 90)), updated_at: '2026-11-11T10:00:00Z' })
    await sincronizar(remoto, U, '0.3.0-beta')
    expect(await db.registros.count()).toBe(2)

    // El dispositivo pierde sus comidas, pero recuerda hasta dónde había bajado.
    await db.registros.clear()
    await sincronizar(remoto, U, '0.3.0-beta')
    expect(await db.registros.get('a')).toBeUndefined() // con el cursor, la comida del día 10 no vuelve

    // Con la versión nueva, se revisa todo de nuevo y aparecen.
    await sincronizar(remoto, U, '0.3.1-beta')
    expect(await db.registros.count()).toBe(2)
  })

  it('la revisión completa no pisa lo que aún no se sube', async () => {
    const { remoto, tabla } = servidorFalso((n) => n === 'food_logs')
    tabla('food_logs').set('a', { ...snake(registro('a', 72)), updated_at: '2026-11-10T10:00:00Z' })
    await guardar('registros', registro('a', 500)) // editado aquí, el servidor lo rechaza por ahora
    await sincronizar(remoto, U, '0.3.1-beta')
    expect((await db.registros.get('a'))?.kcal).toBe(500)
  })

  it('si la subida falla, igual baja lo del servidor y lo propio queda pendiente', async () => {
    const { remoto, tabla } = servidorFalso()
    tabla('weights').set(`${U}|2026-11-10`, { user_id: U, fecha: '2026-11-10', kg: 81.5, updated_at: '2026-11-10T10:00:00Z', deleted_at: null })
    const sinSubida: Remoto = { ...remoto, upsert: () => Promise.reject(new Error('Failed to fetch')) }
    await guardar('registros', registro('x', 10))
    await sincronizar(sinSubida, U, '0.3.1-beta')
    expect(await db.pesos.count()).toBe(1)
    expect(await db.pendientes.count()).toBe(1)
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
