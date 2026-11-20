// Suplementos (RF-26), medidas (RF-35) y fotos de progreso (RF-34): validaciones y cálculos puros.

export interface DatosSuplemento {
  nombre: string
  dosis: string
  /** "HH:MM" o vacío (sin hora). */
  hora: string
  kcal: number
  proteina: number
}

export type ErroresSuplemento = Partial<Record<'nombre' | 'dosis' | 'hora' | 'kcal' | 'proteina', string>>

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export function validarSuplemento(d: DatosSuplemento): ErroresSuplemento {
  const e: ErroresSuplemento = {}
  if (!d.nombre.trim()) e.nombre = 'Ponle un nombre'
  else if (d.nombre.trim().length > 60) e.nombre = 'Máximo 60 letras'
  if (d.dosis.trim().length > 40) e.dosis = 'Máximo 40 letras'
  if (d.hora && !HORA.test(d.hora)) e.hora = 'Hora no válida'
  if (!Number.isFinite(d.kcal) || d.kcal < 0 || d.kcal > 2000) e.kcal = 'Entre 0 y 2.000 kcal'
  if (!Number.isFinite(d.proteina) || d.proteina < 0 || d.proteina > 200) e.proteina = 'Entre 0 y 200 g'
  return e
}

export const PARTES = ['cintura', 'pecho', 'brazo', 'muslo'] as const
export type Parte = (typeof PARTES)[number]
export type Medidas = Record<Parte, number | null>
export type ErroresMedidas = Partial<Record<Parte | 'general', string>>

export const MEDIDA_MIN = 10
export const MEDIDA_MAX = 250

export function validarMedidas(m: Medidas): ErroresMedidas {
  const e: ErroresMedidas = {}
  if (PARTES.every((p) => m[p] === null)) return { general: 'Anota al menos una medida' }
  for (const p of PARTES) {
    const v = m[p]
    if (v !== null && (!Number.isFinite(v) || v < MEDIDA_MIN || v > MEDIDA_MAX)) e[p] = `Entre ${MEDIDA_MIN} y ${MEDIDA_MAX} cm`
  }
  return e
}

/** Cambio de cada medida entre su primer y su último registro (en cm, con 1 decimal). */
export function cambioMedidas(lista: readonly (Medidas & { fecha: string })[]): Medidas {
  const orden = [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const cambio = {} as Medidas
  for (const p of PARTES) {
    const valores = orden.map((m) => m[p]).filter((v): v is number => v !== null)
    cambio[p] = valores.length >= 2 ? Math.round((valores.at(-1)! - valores[0]!) * 10) / 10 : null
  }
  return cambio
}

export const FOTO_MAX_PX = 1080

/** Tamaño de la foto comprimida: el lado mayor queda en 1080 px como máximo (nunca se agranda). */
export function dimensionesFoto(ancho: number, alto: number, max = FOTO_MAX_PX): { ancho: number; alto: number } {
  const escala = Math.min(1, max / Math.max(ancho, alto))
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) }
}
