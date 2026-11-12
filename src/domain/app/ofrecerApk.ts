// Aviso "Descarga la app" en Hoy: solo en la web de un Android sin la app. "Ahora no" lo esconde 30 días.
import { sumarDias } from '../format/formato'

export const CLAVE_DESCARTE_APK = 'kaibu:apk-descartado'
const DIAS_PAUSA = 30

export interface EntradaOfrecerApk {
  sistema: 'android' | 'ios' | 'otro'
  esApp: boolean
  /** Fecha (YYYY-MM-DD) del último "Ahora no". */
  descartadaEl: string | null
  hoy: string
}

export function debeOfrecerApk({ sistema, esApp, descartadaEl, hoy }: EntradaOfrecerApk): boolean {
  if (sistema !== 'android' || esApp) return false
  return descartadaEl === null || sumarDias(descartadaEl, DIAS_PAUSA) <= hoy
}

/** Lee la fecha guardada; ante cualquier dato raro, como si nunca se hubiera descartado. */
export function leerDescarteApk(raw: string | null): string | null {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}
