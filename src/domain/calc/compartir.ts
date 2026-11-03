// Textos de la imagen para compartir el progreso (estilo historias). Sin peso exacto salvo que la persona lo pida.
import { formatoNumero } from '../format/formato'
import type { Periodo, ResumenPeriodo } from './resumenSemanal'
import type { Objetivo } from './types'

export interface DatoTarjeta {
  valor: string
  etiqueta: string
}

export interface TarjetaCompartir {
  titulo: string
  subtitulo: string
  datos: DatoTarjeta[]
}

export interface EntradaTarjeta {
  resumen: ResumenPeriodo
  periodo: Periodo
  racha: number
  /** Kilos avanzados hacia la meta en la fase actual (positivo = avance). */
  kgAvanzados: number
  objetivo: Objetivo
  pesoKg: number | null
  mostrarPeso: boolean
}

export function tarjetaCompartir(e: EntradaTarjeta): TarjetaCompartir {
  const { resumen: r } = e
  const total = r.diasTranscurridos
  const datos: DatoTarjeta[] = [
    { valor: `${r.diasKcal}/${total}`, etiqueta: 'días con mis kcal' },
    { valor: `${r.diasProteina}/${total}`, etiqueta: 'días con mi proteína' },
  ]
  if (e.racha > 0) datos.push({ valor: formatoNumero(e.racha), etiqueta: e.racha === 1 ? 'día de racha' : 'días de racha' })
  if (e.objetivo !== 'mantener' && e.kgAvanzados > 0) {
    const signo = e.objetivo === 'perder' ? '−' : '+'
    datos.push({ valor: `${signo}${formatoNumero(e.kgAvanzados, 1)} kg`, etiqueta: 'en esta fase' })
  }
  if (e.mostrarPeso && e.pesoKg !== null) datos.push({ valor: `${formatoNumero(e.pesoKg, 1)} kg`, etiqueta: 'peso promedio' })
  return {
    titulo: e.periodo === 'semana' ? 'Mi semana con Kaibu' : 'Mi mes con Kaibu',
    subtitulo: `${r.diasConRegistro} de ${total} ${total === 1 ? 'día anotado' : 'días anotados'}`,
    datos,
  }
}
