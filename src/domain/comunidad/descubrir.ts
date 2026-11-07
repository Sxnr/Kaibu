// Recordatorios de que existe la Comunidad, sin ser invasivos:
// una tarjeta en Hoy (desde el 2.º día de uso, nunca junto al tutorial, "Ahora no" la esconde 14 días
// y tras 2 veces no vuelve), un punto "Nuevo" hasta visitarla y una sugerencia única al compartir la semana.
import { sumarDias } from '../format/formato'

export interface EstadoDescubrir {
  visitada: boolean
  /** Fecha (YYYY-MM-DD) del último "Ahora no". */
  descartadaEl: string | null
  descartes: number
  sugeridaTrasCompartir: boolean
}

export const CLAVE_DESCUBRIR = 'kaibu:comunidad'
export const ESTADO_INICIAL: EstadoDescubrir = { visitada: false, descartadaEl: null, descartes: 0, sugeridaTrasCompartir: false }

const DIAS_MINIMOS_USO = 2
const DIAS_PAUSA = 14
const MAX_DESCARTES = 2

/** Lee lo guardado en el dispositivo; ante cualquier dato raro, parte de cero. */
export function leerEstado(raw: string | null): EstadoDescubrir {
  if (!raw) return ESTADO_INICIAL
  try {
    const d = JSON.parse(raw) as Partial<Record<keyof EstadoDescubrir, unknown>>
    return {
      visitada: d.visitada === true,
      descartadaEl: typeof d.descartadaEl === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.descartadaEl) ? d.descartadaEl : null,
      descartes: typeof d.descartes === 'number' && Number.isInteger(d.descartes) && d.descartes >= 0 ? d.descartes : 0,
      sugeridaTrasCompartir: d.sugeridaTrasCompartir === true,
    }
  } catch {
    return ESTADO_INICIAL
  }
}

export interface EntradaInvitar {
  estado: EstadoDescubrir
  hoy: string
  /** Días distintos con comidas anotadas. */
  diasConRegistro: number
  tutorialVisto: boolean
  hayInvitacion: boolean
}

/** ¿Mostrar la tarjeta "Únete a la comunidad" en Hoy? */
export function debeInvitarEnHoy({ estado, hoy, diasConRegistro, tutorialVisto, hayInvitacion }: EntradaInvitar): boolean {
  if (!hayInvitacion || !tutorialVisto || estado.visitada) return false
  if (diasConRegistro < DIAS_MINIMOS_USO) return false
  if (estado.descartes >= MAX_DESCARTES) return false
  return estado.descartadaEl === null || sumarDias(estado.descartadaEl, DIAS_PAUSA) <= hoy
}

export const descartar = (estado: EstadoDescubrir, hoy: string): EstadoDescubrir => ({ ...estado, descartadaEl: hoy, descartes: estado.descartes + 1 })
export const marcarVisitada = (estado: EstadoDescubrir): EstadoDescubrir => ({ ...estado, visitada: true })
export const marcarSugerida = (estado: EstadoDescubrir): EstadoDescubrir => ({ ...estado, sugeridaTrasCompartir: true })

/** Punto "Nuevo" en Más y en Comunidad, hasta que la persona entra una vez. */
export const mostrarNuevo = (estado: EstadoDescubrir): boolean => !estado.visitada

/** Tras compartir la semana: sugerir la Comunidad una sola vez (si aún no la conoce). */
export const debeSugerirTrasCompartir = (estado: EstadoDescubrir): boolean => !estado.visitada && !estado.sugeridaTrasCompartir
