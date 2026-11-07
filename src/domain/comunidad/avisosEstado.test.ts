import { describe, expect, it } from 'vitest'
import { cambiosDeEstado, mapaEstados, textoCambio } from './avisosEstado'

const r = (id: string, estado: string, tipo: 'bug' | 'sugerencia' = 'sugerencia', titulo: string | null = 'Modo oscuro') =>
  ({ id, estado, tipo, titulo, descripcion: 'Una descripción larga del envío' }) as const

describe('avisos cuando el equipo cambia el estado de lo que enviaste', () => {
  it('avisa solo los cambios importantes de envíos que ya conocía', () => {
    const vistos = { a: 'publicado', b: 'publicado', c: 'enviado' } as const
    const actuales = [r('a', 'aprobada'), r('b', 'publicado'), r('c', 'publicado'), r('d', 'resuelto', 'bug')]
    expect(cambiosDeEstado(vistos, actuales).map((c) => c.id)).toEqual(['a'])
  })

  it('la primera vez (sin nada guardado) no avisa nada', () => {
    expect(cambiosDeEstado({}, [r('a', 'resuelto', 'bug')])).toEqual([])
  })

  it('texto claro según el estado, con el título o el inicio de la descripción', () => {
    expect(textoCambio(r('a', 'aprobada'))).toBe('Tu sugerencia "Modo oscuro" fue aprobada para construirla')
    expect(textoCambio(r('b', 'resuelto', 'bug', null))).toBe('Tu reporte "Una descripción larga del envío" quedó resuelto')
    expect(textoCambio(r('c', 'fuera_alcance'))).toBe('Tu sugerencia "Modo oscuro" quedó fuera de alcance por ahora')
  })

  it('mapaEstados guarda el estado actual de cada envío', () => {
    expect(mapaEstados([r('a', 'aprobada'), r('b', 'enviado')])).toEqual({ a: 'aprobada', b: 'enviado' })
  })
})
