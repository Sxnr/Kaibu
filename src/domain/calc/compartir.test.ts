import { describe, expect, it } from 'vitest'
import { tarjetaCompartir } from './compartir'

const resumen = { diasTranscurridos: 7, diasConRegistro: 6, diasKcal: 5, diasProteina: 4, diasAmbos: 4, promedio: { kcal: 1850, proteina: 132, carbos: 180, grasas: 60 } }

describe('tarjeta para compartir el progreso', () => {
  it('resume la semana sin mostrar el peso por defecto', () => {
    const t = tarjetaCompartir({ resumen, periodo: 'semana', racha: 12, kgAvanzados: 2.4, objetivo: 'perder', pesoKg: 78.3, mostrarPeso: false })
    expect(t.titulo).toBe('Mi semana con Kaibu')
    expect(t.datos).toEqual([
      { valor: '5/7', etiqueta: 'días con mis kcal' },
      { valor: '4/7', etiqueta: 'días con mi proteína' },
      { valor: '12', etiqueta: 'días de racha' },
      { valor: '−2,4 kg', etiqueta: 'en esta fase' },
    ])
    expect(JSON.stringify(t)).not.toContain('78')
  })

  it('muestra el peso solo si la persona lo pide', () => {
    const t = tarjetaCompartir({ resumen, periodo: 'mes', racha: 0, kgAvanzados: 0, objetivo: 'mantener', pesoKg: 78.3, mostrarPeso: true })
    expect(t.titulo).toBe('Mi mes con Kaibu')
    expect(t.datos).toContainEqual({ valor: '78,3 kg', etiqueta: 'peso promedio' })
    expect(t.datos.some((d) => d.etiqueta === 'en esta fase')).toBe(false)
  })

  it('en volumen los kilos se muestran como ganados', () => {
    const t = tarjetaCompartir({ resumen, periodo: 'semana', racha: 3, kgAvanzados: 1.2, objetivo: 'ganar', pesoKg: null, mostrarPeso: false })
    expect(t.datos).toContainEqual({ valor: '+1,2 kg', etiqueta: 'en esta fase' })
  })
})
