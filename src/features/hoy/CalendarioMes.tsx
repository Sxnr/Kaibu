// Calendario del mes para saltar a cualquier día: los pasados con su estado y los futuros planificados.
import { CalendarClock, Check, ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Boton } from '@/components/ui/button'
import { Hoja } from '@/components/ui/hoja'
import type { EstadoDia } from '@/domain/calc/dia'
import { fechaLarga, nombreDia, numeroDia } from '@/domain/format/formato'
import { calendarioMes, enRangoPlan, mesAnterior, mesSiguiente } from '@/domain/plan/calendario'
import { cn } from '@/lib/utils'

interface Props {
  abierta: boolean
  alCambiar: (abierta: boolean) => void
  fecha: string
  hoy: string
  estados: Record<string, EstadoDia>
  planificados: ReadonlySet<string>
  alElegir: (fecha: string) => void
}

const CABECERA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const NOMBRES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const TEXTO: Record<EstadoDia, string> = { cumplido: 'cumplido', fuera: 'fuera de rango', sin_registro: 'sin registro' }

export function CalendarioMes({ abierta, alCambiar, fecha, hoy, estados, planificados, alElegir }: Props) {
  const [mes, setMes] = useState(fecha.slice(0, 8) + '01')
  const semanas = calendarioMes(mes)
  const titulo = fechaLarga(mes).split(' de ').slice(1).join(' de ')
  const siguiente = mesSiguiente(mes)

  return (
    <Hoja
      abierta={abierta}
      alCambiar={(a) => {
        if (a) setMes(fecha.slice(0, 8) + '01')
        alCambiar(a)
      }}
      titulo="Calendario"
      descripcion="Toca un día para verlo o planificarlo."
    >
      <div className="mb-3 flex items-center justify-between">
        <Boton variante="fantasma" tamano="icono" onClick={() => setMes(mesAnterior(mes))} aria-label="Mes anterior">
          <ChevronLeft aria-hidden />
        </Boton>
        <p className="font-semibold first-letter:uppercase" aria-live="polite">
          {titulo} {mes.slice(0, 4)}
        </p>
        <Boton variante="fantasma" tamano="icono" onClick={() => setMes(siguiente)} disabled={!enRangoPlan(siguiente, hoy)} aria-label="Mes siguiente">
          <ChevronRight aria-hidden />
        </Boton>
      </div>
      <table className="w-full table-fixed text-center">
        <thead>
          <tr>
            {CABECERA.map((c, i) => (
              <th key={NOMBRES[i]} scope="col" className="pb-1 text-xs font-medium text-texto-secundario">
                <abbr title={NOMBRES[i]} className="no-underline">
                  {c}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana.find(Boolean)}>
              {semana.map((d, i) =>
                d ? (
                  <td key={d} className="p-0.5">
                    <DiaCalendario d={d} hoy={hoy} elegido={d === fecha} estado={estados[d]} planificado={planificados.has(d)} alElegir={alElegir} />
                  </td>
                ) : (
                  <td key={`vacio-${i}`} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-texto-secundario">
        <span className="flex items-center gap-1">
          <Check className="size-3.5 text-exito" aria-hidden /> Cumplido
        </span>
        <span className="flex items-center gap-1">
          <TriangleAlert className="size-3.5 text-alerta" aria-hidden /> Fuera de rango
        </span>
        <span className="flex items-center gap-1">
          <CalendarClock className="size-3.5 text-texto-marca" aria-hidden /> Planificado
        </span>
      </p>
    </Hoja>
  )
}

interface DiaProps {
  d: string
  hoy: string
  elegido: boolean
  estado: EstadoDia | undefined
  planificado: boolean
  alElegir: (fecha: string) => void
}

function DiaCalendario({ d, hoy, elegido, estado, planificado, alElegir }: DiaProps) {
  const futuro = d > hoy
  const marcaPasado = !futuro && d !== hoy && estado && estado !== 'sin_registro'
  const detalle = futuro ? (planificado ? ', planificado' : '') : d === hoy ? ', hoy' : estado ? `, ${TEXTO[estado]}` : ''
  return (
    <button
      type="button"
      disabled={!enRangoPlan(d, hoy)}
      onClick={() => alElegir(d)}
      aria-current={elegido ? 'date' : undefined}
      aria-label={`${nombreDia(d)} ${numeroDia(d)}${detalle}`}
      className={cn(
        'flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-transparent text-sm transition-colors disabled:opacity-30',
        elegido ? 'border-marca bg-superficie-elevada' : 'hover:bg-superficie-elevada',
        d === hoy && 'font-bold text-texto-marca',
      )}
    >
      <span className="num">{numeroDia(d)}</span>
      <span className="grid h-3.5 place-items-center" aria-hidden>
        {futuro && planificado && <CalendarClock className="size-3 text-texto-marca" />}
        {marcaPasado && estado === 'cumplido' && <Check className="size-3 text-exito" strokeWidth={3} />}
        {marcaPasado && estado === 'fuera' && <TriangleAlert className="size-3 text-alerta" />}
      </span>
    </button>
  )
}
