// Formato chileno: coma decimal, punto de miles, fechas en español y semana de lunes a domingo.
// Se implementa a mano (sin Intl) para que el resultado sea idéntico en todos los navegadores.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const
const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/** Número con punto de miles y coma decimal. Ej: 2350 → "2.350", 91.1 → "91,1". */
export function formatoNumero(valor: number, decimales = 0): string {
  if (!Number.isFinite(valor)) return '—'
  const negativo = valor < 0
  const [entero = '0', fraccion] = Math.abs(valor).toFixed(decimales).split('.')
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const texto = fraccion ? `${conMiles},${fraccion}` : conMiles
  return negativo && Number(Math.abs(valor).toFixed(decimales)) !== 0 ? `−${texto}` : texto
}

/** Convierte "91,1" o "91.1" en número. Devuelve null si no es válido. */
export function parseDecimal(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '' || !/^-?\d+(\.\d+)?$/.test(limpio)) return null
  return Number(limpio)
}

/** Fecha local (zona horaria del dispositivo) en formato AAAA-MM-DD. */
export function hoyISO(ahora: Date = new Date()): string {
  return aISO(ahora)
}

export function aISO(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** Convierte AAAA-MM-DD a Date local a mediodía (evita saltos por horario de verano). */
export function desdeISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(a, m - 1, d, 12)
}

export function sumarDias(iso: string, dias: number): string {
  const f = desdeISO(iso)
  f.setDate(f.getDate() + dias)
  return aISO(f)
}

/** Diferencia en días entre dos fechas ISO (b − a). */
export function diferenciaDias(a: string, b: string): number {
  return Math.round((desdeISO(b).getTime() - desdeISO(a).getTime()) / 86_400_000)
}

/** Lunes de la semana de la fecha dada. */
export function inicioSemana(iso: string): string {
  const dia = desdeISO(iso).getDay() // 0 = domingo
  const desdeLunes = (dia + 6) % 7
  return sumarDias(iso, -desdeLunes)
}

/** Los 7 días (lunes a domingo) de la semana de la fecha dada. */
export function diasDeSemana(iso: string): string[] {
  const lunes = inicioSemana(iso)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

/** "sábado 24 de octubre" */
export function fechaLarga(iso: string): string {
  const f = desdeISO(iso)
  return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`
}

/** "24 oct" */
export function fechaCorta(iso: string): string {
  const f = desdeISO(iso)
  return `${f.getDate()} ${MESES[f.getMonth()]!.slice(0, 3)}`
}

/** "24 de octubre de 2026" */
export function fechaCompleta(iso: string): string {
  const f = desdeISO(iso)
  return `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`
}

export function nombreDia(iso: string): string {
  return DIAS[desdeISO(iso).getDay()]!
}

export function inicialDia(iso: string): string {
  return DIAS_CORTOS[desdeISO(iso).getDay()]!
}

export function numeroDia(iso: string): number {
  return desdeISO(iso).getDate()
}
