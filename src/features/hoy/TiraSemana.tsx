import { CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, Minus, TriangleAlert } from 'lucide-react'
import { Boton } from '@/components/ui/button'
import type { EstadoDia } from '@/domain/calc/dia'
import { diasDeSemana, fechaLarga, inicialDia, nombreDia, numeroDia, sumarDias } from '@/domain/format/formato'
import { enRangoPlan } from '@/domain/plan/calendario'
import { cn } from '@/lib/utils'

const mesDe = (iso: string) => fechaLarga(iso).split(' de ')[1] ?? ''

interface Props {
  fecha: string
  hoy: string
  estados: Record<string, EstadoDia>
  /** Días futuros que ya tienen comidas planificadas. */
  planificados: ReadonlySet<string>
  alElegir: (fecha: string) => void
  alAbrirCalendario: () => void
}

const TEXTO: Record<EstadoDia, string> = { cumplido: 'cumplido', fuera: 'fuera de rango', sin_registro: 'sin registro' }

/** Título de la semana: "23 – 29 de noviembre" (o con los dos meses si cruza). */
function tituloSemana(dias: string[]): string {
  const [a, b] = [dias[0]!, dias[6]!]
  return mesDe(a) === mesDe(b) ? `${numeroDia(a)} – ${numeroDia(b)} de ${mesDe(b)}` : `${numeroDia(a)} de ${mesDe(a)} – ${numeroDia(b)} de ${mesDe(b)}`
}

/** Semana de lunes a domingo; cada día con su estado (ícono + texto, no solo color). Flechas para cambiar de semana. */
export function TiraSemana({ fecha, hoy, estados, planificados, alElegir, alAbrirCalendario }: Props) {
  const dias = diasDeSemana(fecha)
  const anterior = sumarDias(fecha, -7)
  const siguiente = sumarDias(fecha, 7)
  return (
    <nav aria-label="Días de la semana" className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <Boton variante="fantasma" tamano="icono" onClick={() => alElegir(anterior)} aria-label="Semana anterior">
          <ChevronLeft aria-hidden />
        </Boton>
        <p className="text-sm font-semibold first-letter:uppercase">{tituloSemana(dias)}</p>
        <div className="flex items-center">
          <Boton variante="fantasma" tamano="icono" onClick={() => alElegir(siguiente)} disabled={!enRangoPlan(siguiente, hoy)} aria-label="Semana siguiente">
            <ChevronRight aria-hidden />
          </Boton>
          <Boton variante="fantasma" tamano="icono" onClick={alAbrirCalendario} aria-label="Abrir calendario">
            <CalendarDays aria-hidden />
          </Boton>
        </div>
      </div>
      <ul className="grid grid-cols-7 gap-1">
        {dias.map((d) => {
          const futuro = d > hoy
          const fueraDeRango = !enRangoPlan(d, hoy)
          // Hoy aún no termina: solo se marca si ya está cumplido (sin mensajes culposos).
          const enCurso = d === hoy && estados[d] !== 'cumplido'
          const estado = estados[d] ?? 'sin_registro'
          const planificado = futuro && planificados.has(d)
          const elegido = d === fecha
          const detalle = futuro ? (planificado ? ': planificado' : '') : enCurso ? ': en curso' : `: ${TEXTO[estado]}`
          return (
            <li key={d}>
              <button
                type="button"
                disabled={fueraDeRango}
                onClick={() => alElegir(d)}
                aria-current={elegido ? 'date' : undefined}
                className={cn(
                  'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-transparent text-sm transition-colors disabled:opacity-40',
                  elegido ? 'border-marca bg-superficie' : 'hover:bg-superficie-elevada',
                  futuro && !elegido && 'text-texto-secundario',
                )}
              >
                {/* Lo visible (inicial y número) forma parte del nombre accesible completo */}
                <span className="text-xs text-texto-secundario" aria-hidden>
                  {inicialDia(d)}
                </span>
                <span className="sr-only">{nombreDia(d)} </span>
                <span className={cn('num text-lg leading-none font-bold', d === hoy && 'text-texto-marca')}>{numeroDia(d)}</span>
                <span className="sr-only">{` de ${mesDe(d)}${d === hoy ? ', hoy' : ''}${detalle}`}</span>
                <span className="grid h-4 place-items-center" aria-hidden>
                  {planificado && <CalendarClock className="size-3.5 text-texto-marca" />}
                  {enCurso && <span className="size-2 rounded-full bg-marca" />}
                  {!futuro && !enCurso && estado === 'cumplido' && <Check className="size-3.5 text-exito" strokeWidth={3} />}
                  {!futuro && !enCurso && estado === 'fuera' && <TriangleAlert className="size-3.5 text-alerta" strokeWidth={2.5} />}
                  {!futuro && !enCurso && estado === 'sin_registro' && <Minus className="size-3.5 text-texto-secundario" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
