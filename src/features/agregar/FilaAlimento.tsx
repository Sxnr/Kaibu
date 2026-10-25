import { ChevronRight, Plus, Star } from 'lucide-react'
import type { Alimento } from '@/domain/alimentos/tipos'
import { formatoNumero } from '@/domain/format/formato'

interface Props {
  alimento: Alimento
  detalle?: string
  favorito?: boolean
  alAbrir: () => void
  /** Agregar directo con la última cantidad usada (para recientes). */
  alAgregarDirecto?: () => void
}

export function FilaAlimento({ alimento, detalle, favorito, alAbrir, alAgregarDirecto }: Props) {
  return (
    <li className="flex items-center gap-2">
      <button type="button" onClick={alAbrir} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left hover:bg-superficie-elevada">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{alimento.nombre}</span>
            {favorito && <Star className="size-3.5 shrink-0 fill-carbos text-carbos" aria-label="Favorito" />}
          </span>
          <span className="block truncate text-sm text-texto-secundario">
            {detalle ?? `${formatoNumero(alimento.kcal)} kcal / 100 g · P ${formatoNumero(alimento.proteina, 1)} g`}
          </span>
        </span>
        {!alAgregarDirecto && <ChevronRight className="size-5 shrink-0 text-texto-secundario" aria-hidden />}
      </button>
      {alAgregarDirecto && (
        <button
          type="button"
          onClick={alAgregarDirecto}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-superficie-elevada hover:bg-borde motion-safe:active:scale-95"
          aria-label={`Agregar ${alimento.nombre} (${detalle ?? 'misma cantidad'})`}
        >
          <Plus className="size-5" aria-hidden />
        </button>
      )}
    </li>
  )
}
