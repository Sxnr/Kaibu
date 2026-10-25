import { Check, Minus, TriangleAlert } from 'lucide-react'
import type { EstadoDia } from '@/domain/calc/dia'
import { diasDeSemana, fechaLarga, inicialDia, nombreDia, numeroDia } from '@/domain/format/formato'

const mesDe = (iso: string) => fechaLarga(iso).split(' de ')[1] ?? ''
import { cn } from '@/lib/utils'

interface Props {
  fecha: string
  hoy: string
  estados: Record<string, EstadoDia>
  alElegir: (fecha: string) => void
}

const TEXTO: Record<EstadoDia, string> = { cumplido: 'cumplido', fuera: 'fuera de rango', sin_registro: 'sin registro' }

/** Semana de lunes a domingo; cada día con su estado (ícono + texto, no solo color). */
export function TiraSemana({ fecha, hoy, estados, alElegir }: Props) {
  return (
    <nav aria-label="Días de la semana">
      <ul className="grid grid-cols-7 gap-1">
        {diasDeSemana(fecha).map((d) => {
          const futuro = d > hoy
          // Hoy aún no termina: solo se marca si ya está cumplido (sin mensajes culposos).
          const enCurso = d === hoy && estados[d] !== 'cumplido'
          const estado = estados[d] ?? 'sin_registro'
          const elegido = d === fecha
          return (
            <li key={d}>
              <button
                type="button"
                disabled={futuro}
                onClick={() => alElegir(d)}
                aria-current={elegido ? 'date' : undefined}
                className={cn(
                  'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-transparent text-sm transition-colors disabled:opacity-40',
                  elegido ? 'border-marca bg-superficie' : 'hover:bg-superficie-elevada',
                )}
              >
                {/* Lo visible (inicial y número) forma parte del nombre accesible completo */}
                <span className="text-xs text-texto-secundario" aria-hidden>
                  {inicialDia(d)}
                </span>
                <span className="sr-only">{nombreDia(d)} </span>
                <span className={cn('num text-lg leading-none font-bold', d === hoy && 'text-texto-marca')}>{numeroDia(d)}</span>
                <span className="sr-only">
                  {` de ${mesDe(d)}${d === hoy ? ', hoy' : ''}${futuro ? '' : enCurso ? ': en curso' : `: ${TEXTO[estado]}`}`}
                </span>
                <span className="grid h-4 place-items-center" aria-hidden>
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
