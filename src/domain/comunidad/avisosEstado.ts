// Avisos en la app cuando el equipo cambia el estado de un reporte o sugerencia (lo refleja el bot de Discord).
import type { EstadoReporte, TipoReporte } from './reportes'

export interface EnvioConEstado {
  id: string
  estado: EstadoReporte | string
  tipo: TipoReporte
  titulo: string | null
  descripcion: string
}

/** Solo estos cambios merecen aviso ("enviado" → "publicado" es rutina). */
const FRASE: Partial<Record<string, string>> = {
  en_sprint: 'entró al sprint: lo estamos arreglando',
  resuelto: 'quedó resuelto',
  planificada: 'quedó planificada en la hoja de ruta',
  aprobada: 'fue aprobada para construirla',
  fuera_alcance: 'quedó fuera de alcance por ahora',
}

/** Envíos cuyo estado cambió a uno importante desde la última vez (los nuevos no avisan). */
export function cambiosDeEstado(vistos: Readonly<Record<string, string>>, actuales: readonly EnvioConEstado[]): EnvioConEstado[] {
  return actuales.filter((e) => e.id in vistos && vistos[e.id] !== e.estado && FRASE[e.estado] !== undefined)
}

export function textoCambio(e: EnvioConEstado): string {
  const nombre = (e.titulo ?? e.descripcion).trim()
  const corto = nombre.length > 40 ? `${nombre.slice(0, 39)}…` : nombre
  return `Tu ${e.tipo === 'bug' ? 'reporte' : 'sugerencia'} "${corto}" ${FRASE[e.estado] ?? 'cambió de estado'}`
}

export function mapaEstados(actuales: readonly EnvioConEstado[]): Record<string, string> {
  return Object.fromEntries(actuales.map((e) => [e.id, e.estado]))
}
