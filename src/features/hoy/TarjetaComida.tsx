import { Plus } from 'lucide-react'
import { m } from 'motion/react'
import { Link } from 'react-router'
import { formatoNumero } from '@/domain/format/formato'
import type { RegistroComida } from '@/data/db'
import { cn } from '@/lib/utils'
import type { ResumenComida } from './resumenDia'

interface Props {
  comida: ResumenComida
  fecha: string
  metaKcal?: number
  alEditar: (r: RegistroComida) => void
}

/** Una comida del día con su total y sus alimentos (cada uno se puede editar o borrar). */
export function TarjetaComida({ comida, fecha, metaKcal, alEditar }: Props) {
  const vacia = comida.registros.length === 0
  return (
    <m.li layout className="rounded-2xl border border-borde bg-superficie p-3 pl-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{comida.nombre}</h3>
          <p className="truncate text-sm text-texto-secundario">
            {vacia
              ? 'Sin registro'
              : `P ${formatoNumero(comida.total.proteina)} · C ${formatoNumero(comida.total.carbos)} · G ${formatoNumero(comida.total.grasas)} g`}
          </p>
        </div>
        <p className="text-right">
          {vacia ? (
            <span className="text-texto-secundario" aria-label="0 kcal">
              —
            </span>
          ) : (
            <span className="num text-2xl font-bold">{formatoNumero(comida.total.kcal)}</span>
          )}
          {metaKcal !== undefined && <span className="block text-xs text-texto-secundario">de {formatoNumero(metaKcal)}</span>}
        </p>
        <Link
          to={`/agregar?comida=${comida.id}&fecha=${fecha}`}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-superficie-elevada text-texto transition-transform hover:bg-borde motion-safe:active:scale-95"
          aria-label={`Agregar a ${comida.nombre}`}
        >
          <Plus className="size-5" aria-hidden />
        </Link>
      </div>
      {!vacia && (
        <ul className="mt-2 divide-y divide-borde border-t border-borde">
          {comida.registros.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => alEditar(r)}
                className={cn('flex min-h-11 w-full items-center gap-3 py-2 text-left text-sm hover:bg-superficie-elevada/60')}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    <span className="sr-only">Editar </span>
                    {r.nombre}
                  </span>
                  <span className="block text-xs text-texto-secundario">{r.unidad}</span>
                </span>
                <span className="num text-base">{formatoNumero(r.kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </m.li>
  )
}
