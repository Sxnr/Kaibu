// Resumen corto de cada respuesta del cuestionario (para la barra lateral en PC).
import { calcularEdad } from '@/domain/calc/energia'
import { parseDecimal, formatoNumero } from '@/domain/format/formato'
import type { DatosPerfil } from './esquema'

const ACTIVIDAD: Record<string, string> = { sedentario: 'Mayormente sentado', ligero: 'De pie o caminando', activo: 'Trabajo físico' }
const OBJETIVO: Record<string, string> = { perder: 'Perder grasa', mantener: 'Mantener', ganar: 'Ganar músculo' }
const VELOCIDAD: Record<string, string> = { lenta: 'Lenta', recomendada: 'Recomendada', rapida: 'Rápida' }

const kg = (v: string | undefined) => {
  const n = parseDecimal(v ?? '')
  return n === null ? null : `${formatoNumero(n, n % 1 ? 1 : 0)} kg`
}

/** Texto breve de la respuesta de un paso, o null si aún no se responde. */
export function resumenRespuesta(paso: string, v: Partial<DatosPerfil>): string | null {
  switch (paso) {
    case 'nombre':
      return v.nombre?.trim() || null
    case 'sexo':
      return v.sexo ? (v.sexo === 'hombre' ? 'Hombre' : 'Mujer') : null
    case 'nacimiento':
      return v.fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(v.fechaNacimiento) ? `${calcularEdad(v.fechaNacimiento)} años` : null
    case 'estatura': {
      const n = parseDecimal(v.estaturaCm ?? '')
      return n === null ? null : `${formatoNumero(n)} cm`
    }
    case 'peso':
      return kg(v.pesoKg)
    case 'actividad':
      return v.actividad ? (ACTIVIDAD[v.actividad] ?? null) : null
    case 'entrenamiento':
      return v.diasEntrenamiento ? `${v.diasEntrenamiento} ${v.diasEntrenamiento === '1' ? 'día' : 'días'} por semana` : null
    case 'objetivo':
      return v.objetivo ? (OBJETIVO[v.objetivo] ?? null) : null
    case 'meta':
      return kg(v.pesoMeta)
    case 'velocidad':
      return v.velocidad ? (VELOCIDAD[v.velocidad] ?? null) : null
    case 'comidas':
      return v.numComidas ? `${v.numComidas} comidas${v.colaciones ? ' + colaciones' : ''}` : null
    default:
      return null
  }
}
