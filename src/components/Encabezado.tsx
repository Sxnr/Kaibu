import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  titulo: string
  antetitulo?: ReactNode
  acciones?: ReactNode
  className?: string
}

/** Título de pantalla en mayúsculas (Barlow Condensed) con acciones a la derecha. */
export function Encabezado({ titulo, antetitulo, acciones, className }: Props) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {antetitulo && <p className="text-sm text-texto-secundario first-letter:uppercase">{antetitulo}</p>}
        <h1 className="text-4xl sm:text-5xl">{titulo}</h1>
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </header>
  )
}
