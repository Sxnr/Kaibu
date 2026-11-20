import { beforeEach, describe, expect, it, vi } from 'vitest'

// Como en Android: el plugin de Capacitor es un Proxy que falla si alguien le pide ".then"
// (pasa si se devuelve desde una promesa). Así se reproduce el error que avisó Sentry.
const llamadas: string[] = []
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: new Proxy(
    {},
    {
      get(_obj, prop) {
        if (prop === 'then') throw new Error('"LocalNotifications.then()" is not implemented on android')
        return async () => {
          llamadas.push(String(prop))
          return prop === 'getPending' ? { notifications: [{ id: 7 }] } : { display: 'granted' }
        }
      },
    },
  ),
}))
vi.mock('./nativo', () => ({ esNativa: () => true }))

const { estadoPermiso, pedirPermiso, programarAvisos } = await import('./avisos')

describe('avisos en el APK', () => {
  beforeEach(() => {
    llamadas.length = 0
  })
  it('consulta y pide el permiso sin romperse', async () => {
    await expect(estadoPermiso()).resolves.toBe('concedido')
    await expect(pedirPermiso()).resolves.toBe('concedido')
  })
  it('reemplaza lo programado por la lista nueva', async () => {
    await programarAvisos([{ id: 1, tipo: 'comida', ref: 'almuerzo', fecha: '2099-01-01', hora: '14:00', titulo: 'x', cuerpo: 'y' }])
    expect(llamadas).toEqual(['checkPermissions', 'getPending', 'cancel', 'schedule'])
  })
})
