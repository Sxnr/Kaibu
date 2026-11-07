import { describe, expect, it } from 'vitest'
import { debeInvitarEnHoy, debeSugerirTrasCompartir, descartar, ESTADO_INICIAL, leerEstado, marcarSugerida, marcarVisitada, mostrarNuevo } from './descubrir'

const base = { estado: ESTADO_INICIAL, hoy: '2026-11-10', diasConRegistro: 3, tutorialVisto: true, hayInvitacion: true }

describe('recordatorios de que existe la Comunidad (no invasivos)', () => {
  it('invita en Hoy a quien ya usó la app 2 días o más', () => {
    expect(debeInvitarEnHoy(base)).toBe(true)
    expect(debeInvitarEnHoy({ ...base, diasConRegistro: 1 })).toBe(false)
  })

  it('no invita el primer día ni junto al tutorial', () => {
    expect(debeInvitarEnHoy({ ...base, tutorialVisto: false })).toBe(false)
  })

  it('no invita si no hay link al Discord o si ya conoce la Comunidad', () => {
    expect(debeInvitarEnHoy({ ...base, hayInvitacion: false })).toBe(false)
    expect(debeInvitarEnHoy({ ...base, estado: marcarVisitada(ESTADO_INICIAL) })).toBe(false)
  })

  it('"Ahora no" la esconde 14 días; después de 2 veces no vuelve a aparecer', () => {
    const una = descartar(ESTADO_INICIAL, '2026-11-10')
    expect(debeInvitarEnHoy({ ...base, estado: una, hoy: '2026-11-20' })).toBe(false)
    expect(debeInvitarEnHoy({ ...base, estado: una, hoy: '2026-11-24' })).toBe(true)
    const dos = descartar(una, '2026-11-24')
    expect(debeInvitarEnHoy({ ...base, estado: dos, hoy: '2027-03-01' })).toBe(false)
  })

  it('el punto "Nuevo" se ve hasta que la persona entra a Comunidad', () => {
    expect(mostrarNuevo(ESTADO_INICIAL)).toBe(true)
    expect(mostrarNuevo(marcarVisitada(ESTADO_INICIAL))).toBe(false)
  })

  it('después de compartir su semana se sugiere la Comunidad una sola vez', () => {
    expect(debeSugerirTrasCompartir(ESTADO_INICIAL)).toBe(true)
    expect(debeSugerirTrasCompartir(marcarSugerida(ESTADO_INICIAL))).toBe(false)
    expect(debeSugerirTrasCompartir(marcarVisitada(ESTADO_INICIAL))).toBe(false)
  })

  it('lee lo guardado sin romperse con datos viejos o inválidos', () => {
    expect(leerEstado(null)).toEqual(ESTADO_INICIAL)
    expect(leerEstado('no es json')).toEqual(ESTADO_INICIAL)
    expect(leerEstado('{"visitada":true}')).toEqual({ ...ESTADO_INICIAL, visitada: true })
    expect(leerEstado('{"descartes":"x","descartadaEl":5}')).toEqual(ESTADO_INICIAL)
  })

  it('no cambia el estado original (inmutable)', () => {
    const original = { ...ESTADO_INICIAL }
    descartar(original, '2026-11-10')
    marcarVisitada(original)
    expect(original).toEqual(ESTADO_INICIAL)
  })
})
