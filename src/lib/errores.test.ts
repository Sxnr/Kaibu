import { describe, expect, it } from 'vitest'
import { limpiarEvento } from './errores'

describe('limpiarEvento (Sentry sin datos personales)', () => {
  it('quita usuario, cabeceras, cookies, cuerpo, extras y la consulta de la URL', () => {
    const evento = limpiarEvento({
      message: 'falló',
      user: { id: 'u1', email: 'a@b.cl', ip_address: '1.2.3.4' },
      request: {
        url: 'https://kaibu.cl/agregar?fecha=2026-10-29&q=palta#x',
        headers: { Authorization: 'Bearer x' },
        cookies: { sb: 'x' },
        data: { kg: 70 },
        query_string: 'q=palta',
      },
      extra: { perfil: { peso: 70 } },
      breadcrumbs: [{ message: 'algo' }],
    })
    expect(evento.user).toBeUndefined()
    expect(evento.extra).toBeUndefined()
    expect(evento.breadcrumbs).toBeUndefined()
    expect(evento.request).toEqual({ url: 'https://kaibu.cl/agregar' })
    expect(evento.message).toBe('falló')
  })

  it('deja el evento intacto si no trae datos sensibles', () => {
    expect(limpiarEvento({ message: 'x' })).toEqual({ message: 'x' })
  })
})
