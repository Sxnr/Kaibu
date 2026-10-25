import type { AvisoSeguridad } from '@/domain/calc/ajustes'
import type { NivelFactor, Objetivo } from '@/domain/calc/types'

export const NOMBRE_FASE: Record<Objetivo, string> = {
  perder: 'Déficit',
  mantener: 'Mantenimiento',
  ganar: 'Volumen',
}

export const NOMBRE_NIVEL: Record<NivelFactor, string> = {
  sedentario: 'Sedentario',
  ligero: 'Ligero',
  moderado: 'Moderado',
  alto: 'Alto',
  muy_alto: 'Muy alto',
}

/** Un solo aviso respetuoso; la decisión es del usuario. */
export function textoAviso(avisos: AvisoSeguridad[], sexo: 'hombre' | 'mujer' | null): string | null {
  if (avisos.length === 0) return null
  const partes: string[] = []
  if (avisos.includes('kcal_bajo_minimo')) {
    partes.push(`tu meta queda bajo ${sexo === 'mujer' ? '1.200' : '1.500'} kcal al día`)
  }
  if (avisos.includes('ritmo_alto')) partes.push('el ritmo supera el 1 % de tu peso por semana')
  return `Ojo: ${partes.join(' y ')}. Puede costar sostenerlo y afectar tu energía o tu músculo. Te sugerimos una velocidad más lenta, pero tú decides.`
}
