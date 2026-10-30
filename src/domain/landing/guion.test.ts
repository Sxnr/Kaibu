import { describe, expect, it } from 'vitest'
import {
  avanceCapitulo,
  avanceZ,
  capituloActual,
  enReposo,
  erguido,
  escalaRoca,
  FICHAS_COMIDA,
  kcalAnotadas,
  opacidadAjuste,
  opacidadFichas,
  opacidadHoy,
  palabrasEncendidas,
  pasoResorte,
  pisada,
  viajeFicha,
} from './guion'

describe('avance de Sísifo por la ladera', () => {
  it('parte en 0 y llega a la cumbre al final', () => {
    expect(avanceZ(0)).toBe(0)
    expect(avanceZ(1)).toBeCloseTo(24.6, 5)
  })

  it('nunca retrocede al bajar por la página', () => {
    let previo = -Infinity
    for (let p = 0; p <= 1; p += 0.01) {
      const z = avanceZ(p)
      expect(z).toBeGreaterThanOrEqual(previo)
      previo = z
    }
  })

  it('se endereza recién en el último capítulo', () => {
    expect(erguido(0.8)).toBe(0)
    expect(erguido(1)).toBe(1)
  })
})

describe('capítulos', () => {
  it('reparte el avance en 5 capítulos', () => {
    expect(capituloActual(0)).toBe(0)
    expect(capituloActual(0.25)).toBe(1)
    expect(capituloActual(0.49)).toBe(2)
    expect(capituloActual(0.76)).toBe(3)
    expect(capituloActual(1)).toBe(4)
  })

  it('enciende las palabras del título de a una', () => {
    expect(palabrasEncendidas(0, 6)).toBe(0)
    expect(palabrasEncendidas(0.5, 6)).toBe(3)
    expect(palabrasEncendidas(1, 6)).toBe(6)
    expect(palabrasEncendidas(2, 6)).toBe(6)
  })

  it('mide cuánto entró un capítulo en la pantalla', () => {
    expect(avanceCapitulo(900, 900)).toBe(0)
    expect(avanceCapitulo(-500, 900)).toBe(1)
  })
})

describe('comidas que salen de la roca', () => {
  it('hay 4 comidas que suman 1.710 kcal', () => {
    expect(FICHAS_COMIDA.map((f) => f.nombre)).toEqual(['Desayuno', 'Almuerzo', 'Once', 'Cena'])
    expect(FICHAS_COMIDA.reduce((s, f) => s + f.kcal, 0)).toBe(1710)
  })

  it('cada comida vuela una sola vez y en orden', () => {
    expect(viajeFicha(0, 0.3)).toBe(0)
    expect(viajeFicha(0, 0.5)).toBe(1)
    expect(viajeFicha(3, 0.45)).toBe(0)
    expect(viajeFicha(3, 0.6)).toBe(1)
  })

  it('la roca se aliviana y el resumen suma lo anotado', () => {
    expect(escalaRoca(0)).toBe(1)
    expect(escalaRoca(1)).toBeCloseTo(0.68, 5)
    expect(kcalAnotadas(0)).toBe(0)
    expect(kcalAnotadas(1)).toBe(1710)
  })

  it('las fichas y tarjetas solo se ven en su capítulo', () => {
    expect(opacidadFichas(0)).toBe(0)
    expect(opacidadFichas(0.3)).toBe(1)
    expect(opacidadFichas(0.7)).toBe(0)
    expect(opacidadHoy(0.2)).toBe(0)
    expect(opacidadHoy(0.5)).toBe(1)
    expect(opacidadAjuste(0.5)).toBe(0)
    expect(opacidadAjuste(0.75)).toBe(1)
  })
})

describe('resorte del scroll', () => {
  it('llega al objetivo sin pasarse (sin rebote)', () => {
    let estado = { p: 0, v: 0 }
    let maximo = 0
    for (let i = 0; i < 120; i++) {
      estado = pasoResorte(estado, 1, 1 / 60)
      maximo = Math.max(maximo, estado.p)
    }
    expect(estado.p).toBeCloseTo(1, 3)
    expect(maximo).toBeLessThanOrEqual(1.0005)
  })

  it('se detiene cuando ya llegó', () => {
    expect(enReposo({ p: 0.5, v: 0 }, 0.5)).toBe(true)
    expect(enReposo({ p: 0.4, v: 0 }, 0.5)).toBe(false)
  })
})

describe('pisadas', () => {
  it('el pie apoyado no se desliza mientras el cuerpo avanza', () => {
    const a = pisada(0.1, 0, 1, 0)
    const b = pisada(0.2, 0, 1, 0)
    expect(a.alza).toBe(0)
    expect(b.z).toBeCloseTo(a.z, 6)
  })

  it('al dar el paso el pie se levanta y avanza', () => {
    const enElAire = pisada(0.8 * 0.8, 0, 1, 0)
    expect(enElAire.alza).toBeGreaterThan(0)
  })

  it('cada pie va a su lado y en la cumbre quedan quietos', () => {
    expect(pisada(1, 0, 1, 0).x).toBeGreaterThan(0)
    expect(pisada(1, 0.5, -1, 0).x).toBeLessThan(0)
    const quieto = pisada(24.6, 0, 1, 1)
    expect(quieto.alza).toBe(0)
    expect(quieto.talon).toBe(0)
  })
})
