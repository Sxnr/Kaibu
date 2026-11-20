import type { ReactNode } from 'react'
import { ComoSeUsa } from '@/components/ComoSeUsa'
import type { ClaveGuia } from '@/features/ayuda/guias'
import { cn } from '@/lib/utils'

interface Props {
  titulo: string
  antetitulo?: ReactNode
  acciones?: ReactNode
  /** Guía "¿Cómo se usa?" de la sección. */
  ayuda?: ClaveGuia
  className?: string
}

/** Título de pantalla en mayúsculas (Barlow Condensed) con acciones a la derecha. */
export function Encabezado({ titulo, antetitulo, acciones, ayuda, className }: Props) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {antetitulo && <p className="text-sm text-texto-secundario first-letter:uppercase">{antetitulo}</p>}
        <h1 className="text-4xl sm:text-5xl">{titulo}</h1>
      </div>
      {(acciones || ayuda) && (
        <div className="flex flex-wrap items-center gap-2">
          {ayuda && <ComoSeUsa guia={ayuda} />}
          {acciones}
        </div>
      )}
    </header>
  )
}
