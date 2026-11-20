// Recordatorios (RF-36): qué notificaciones programar y cuándo (lógica pura).
// Se recalculan cada vez que se abre la app o cambian los datos; nada suena sin permiso.
import { sumarDias } from '../format/formato'

export interface PreferenciasAvisos {
  /** Interruptor general: apagado hasta que la persona lo activa y da permiso. */
  activos: boolean
  comidas: boolean
  finDia: boolean
  inactividad: boolean
  agua: boolean
  suplementos: boolean
  /** Horario de silencio "HH:MM" (puede cruzar la medianoche). */
  silencioDesde: string
  silencioHasta: string
}

export const PREFERENCIAS_INICIALES: PreferenciasAvisos = {
  activos: false,
  comidas: true,
  finDia: true,
  inactividad: true,
  agua: true,
  suplementos: true,
  silencioDesde: '22:30',
  silencioHasta: '08:00',
}

export const CLAVE_PREFERENCIAS_AVISOS = 'kaibu:avisos'

export type TipoAviso = 'comida' | 'fin_dia' | 'inactividad' | 'agua' | 'suplemento'

export interface Aviso {
  id: number
  tipo: TipoAviso
  /** Comida o suplemento al que se refiere. */
  ref: string | null
  fecha: string
  hora: string
  titulo: string
  cuerpo: string
}

export interface EstadoAvisos {
  hoy: string
  horaActual: string
  comidas: { id: string; nombre: string }[]
  /** Comidas con algo anotado o planificado, por fecha. */
  comidasPorFecha: Record<string, ReadonlySet<string>>
  kcalHoy: number
  /** Mínimo del rango de kcal del día. */
  kcalMinima: number
  /** Último día pasado (o hoy) con comidas anotadas; lo planificado no cuenta. */
  ultimoDiaConRegistro: string | null
  aguaHoyMl: number
  aguaMetaMl: number
  suplementos: { id: string; nombre: string; hora: string | null; tomadoHoy: boolean }[]
}

const HORA_COMIDA: Record<string, string> = { desayuno: '09:00', almuerzo: '14:00', once: '18:00', cena: '21:00' }
const HORA_FIN_DIA = '20:30'
const HORAS_AGUA = ['11:00', '16:00']
const HORA_INACTIVIDAD = '19:00'
const DIAS_INACTIVIDAD = [2, 4, 7]
/** Se programan los avisos de hoy y de los 2 días siguientes; al abrir la app se vuelven a calcular. */
const DIAS_PROGRAMADOS = 3

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

/** ¿La hora cae en el silencio? (desde incluido, hasta excluido; puede cruzar la medianoche). */
export function enSilencio(hora: string, desde: string, hasta: string): boolean {
  if (desde === hasta) return false
  return desde < hasta ? hora >= desde && hora < hasta : hora >= desde || hora < hasta
}

/** Número estable y positivo (las notificaciones de Android necesitan un id entero). */
function idDe(clave: string): number {
  let h = 5381
  for (let i = 0; i < clave.length; i++) h = (Math.imul(h, 33) + clave.charCodeAt(i)) | 0
  return ((h >>> 0) % 2_147_483_646) + 1
}

function aviso(tipo: TipoAviso, ref: string | null, fecha: string, hora: string, titulo: string, cuerpo: string): Aviso {
  return { id: idDe(`${tipo}:${ref ?? ''}:${fecha}:${hora}`), tipo, ref, fecha, hora, titulo, cuerpo }
}

function avisosDelDia(p: PreferenciasAvisos, e: EstadoAvisos, fecha: string): Aviso[] {
  const esHoy = fecha === e.hoy
  const anotadas = e.comidasPorFecha[fecha] ?? new Set<string>()
  const lista: Aviso[] = []
  if (p.comidas)
    for (const c of e.comidas) {
      const hora = HORA_COMIDA[c.id]
      if (!hora || anotadas.has(c.id)) continue
      lista.push(aviso('comida', c.id, fecha, hora, `¿Ya anotaste tu ${c.nombre.toLowerCase()}?`, 'Tómate 10 segundos para anotarlo en Kaibu.'))
    }
  if (p.finDia && !(esHoy && e.kcalHoy >= e.kcalMinima)) {
    const falta = Math.max(0, Math.round(e.kcalMinima - e.kcalHoy))
    const cuerpo = esHoy ? `Te faltan ${falta.toLocaleString('es-CL')} kcal para tu rango. Anota lo que comiste antes de dormir.` : 'Revisa que tu día quede completo en Kaibu.'
    lista.push(aviso('fin_dia', null, fecha, HORA_FIN_DIA, 'Se te está acabando el día', cuerpo))
  }
  if (p.agua && !(esHoy && e.aguaHoyMl >= e.aguaMetaMl))
    for (const hora of HORAS_AGUA) lista.push(aviso('agua', null, fecha, hora, 'Un vaso de agua', 'Súmalo en Kaibu con un toque.'))
  if (p.suplementos)
    for (const s of e.suplementos) {
      if (!s.hora || (esHoy && s.tomadoHoy)) continue
      lista.push(aviso('suplemento', s.id, fecha, s.hora, `Hora de tu ${s.nombre.toLowerCase()}`, 'Márcalo como tomado en Kaibu.'))
    }
  return lista
}

function avisosInactividad(e: EstadoAvisos): Aviso[] {
  const desde = e.ultimoDiaConRegistro ?? e.hoy
  return DIAS_INACTIVIDAD.map((n) =>
    aviso('inactividad', null, sumarDias(desde, n), HORA_INACTIVIDAD, `Llevas ${n} días sin anotar`, 'No pasa nada: retoma hoy con una comida. Tu plan sigue ahí.'),
  )
}

/** Avisos a programar, ordenados por fecha y hora. Solo los que aún no pasan y no caen en silencio. */
export function planificarAvisos(p: PreferenciasAvisos, e: EstadoAvisos): Aviso[] {
  if (!p.activos) return []
  const dias = Array.from({ length: DIAS_PROGRAMADOS }, (_, i) => sumarDias(e.hoy, i))
  const todos = [...dias.flatMap((f) => avisosDelDia(p, e, f)), ...(p.inactividad ? avisosInactividad(e) : [])]
  const ahora = `${e.hoy} ${e.horaActual}`
  return todos
    .filter((a) => `${a.fecha} ${a.hora}` > ahora && !enSilencio(a.hora, p.silencioDesde, p.silencioHasta))
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
}

/** Lee las preferencias guardadas en el dispositivo; ante cualquier dato raro, usa el valor inicial. */
export function leerPreferencias(raw: string | null): PreferenciasAvisos {
  if (!raw) return PREFERENCIAS_INICIALES
  try {
    const d = JSON.parse(raw) as Partial<Record<keyof PreferenciasAvisos, unknown>>
    const bool = (k: 'activos' | 'comidas' | 'finDia' | 'inactividad' | 'agua' | 'suplementos') => (typeof d[k] === 'boolean' ? (d[k] as boolean) : PREFERENCIAS_INICIALES[k])
    const hora = (k: 'silencioDesde' | 'silencioHasta') => (typeof d[k] === 'string' && HORA.test(d[k] as string) ? (d[k] as string) : PREFERENCIAS_INICIALES[k])
    return {
      activos: bool('activos'),
      comidas: bool('comidas'),
      finDia: bool('finDia'),
      inactividad: bool('inactividad'),
      agua: bool('agua'),
      suplementos: bool('suplementos'),
      silencioDesde: hora('silencioDesde'),
      silencioHasta: hora('silencioHasta'),
    }
  } catch {
    return PREFERENCIAS_INICIALES
  }
}
