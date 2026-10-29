// Ajuste semanal (RN-11): cuándo se revisa, si ya se respondió y cuánto ajuste rige hoy.
import { desdeISO, sumarDias } from '../format/formato'
import { planTransicion, type Sugerencia } from './ajustes'

export type TipoEvento = 'ajuste_semanal' | 'aviso_seguridad' | 'cambio_fase' | 'dia_terminado' | 'celebracion'

/** Evento del usuario que debe ocurrir una sola vez (se sincroniza entre dispositivos). */
export interface EventoUsuario {
  tipo: TipoEvento
  /** Semana ISO, fecha o causa: junto con el tipo identifica el evento. */
  clave: string
  /** Ajuste aceptado en kcal ("-150"), "rechazado" u otro detalle. */
  valor: string | null
  /** Fecha desde la que rige o en que ocurrió (AAAA-MM-DD). */
  fecha: string
}

/** Semana ISO 8601 (lunes a domingo): "2026-W44". */
export function semanaISO(iso: string): string {
  const f = desdeISO(iso)
  const diaSemana = (f.getDay() + 6) % 7 // 0 = lunes
  const jueves = sumarDias(iso, 3 - diaSemana)
  const anio = Number(jueves.slice(0, 4))
  const primerJueves = sumarDias(`${anio}-01-04`, 3 - ((desdeISO(`${anio}-01-04`).getDay() + 6) % 7))
  const semana = 1 + Math.round((desdeISO(jueves).getTime() - desdeISO(primerJueves).getTime()) / (7 * 86_400_000))
  return `${anio}-W${String(semana).padStart(2, '0')}`
}

/** El ajuste se revisa el domingo; si no se vio, también el lunes. */
export function esDiaDeRevision(iso: string): boolean {
  const dia = desdeISO(iso).getDay()
  return dia === 0 || dia === 1
}

/** Semana que se revisa: el lunes corresponde a la semana que terminó el domingo. */
export function claveRevision(iso: string): string {
  return semanaISO(desdeISO(iso).getDay() === 1 ? sumarDias(iso, -1) : iso)
}

export function debeMostrarAjuste({
  hoy,
  sugerencia,
  eventos,
}: {
  hoy: string
  sugerencia: Sugerencia | null
  eventos: EventoUsuario[]
}): boolean {
  if (!sugerencia || !esDiaDeRevision(hoy)) return false
  const clave = claveRevision(hoy)
  return !eventos.some((e) => e.tipo === 'ajuste_semanal' && e.clave === clave)
}

/** Suma de ajustes que ya rigen en la fase actual (semanales aceptados y pasos de transición). */
export function ajusteVigente(eventos: EventoUsuario[], hoy: string, faseInicio: string | null): number {
  return eventos
    .filter((e) => e.tipo === 'ajuste_semanal' && e.fecha <= hoy && (!faseInicio || e.fecha >= faseInicio))
    .map((e) => Number(e.valor))
    .filter((v) => Number.isFinite(v))
    .reduce((s, v) => s + v, 0)
}

export interface PasoTransicion {
  clave: string
  valor: number
  fecha: string
}

/**
 * RN-13 · Subida gradual al cambiar de fase: se parte en las kcal actuales y se suben 150 kcal
 * por semana hasta el destino. Se guarda como ajustes (el primero, negativo, desde hoy).
 */
export function pasosTransicion(kcalActual: number, kcalDestino: number, hoy: string, maxPrimerPaso = 1500): PasoTransicion[] {
  if (kcalDestino <= kcalActual) return []
  const inicio = Math.max(kcalActual, kcalDestino - maxPrimerPaso)
  const escalones = planTransicion(inicio, kcalDestino)
  const pasos: PasoTransicion[] = [{ clave: `transicion:${hoy}:0`, valor: inicio - kcalDestino, fecha: hoy }]
  let anterior = inicio
  escalones.forEach((kcal, i) => {
    pasos.push({ clave: `transicion:${hoy}:${i + 1}`, valor: kcal - anterior, fecha: sumarDias(hoy, 7 * (i + 1)) })
    anterior = kcal
  })
  return pasos
}
