import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  icono: LucideIcon
  titulo: string
  texto: ReactNode
  accion?: ReactNode
  className?: string
  compacto?: boolean
}

/** Estado vacío: explica qué va aquí y cómo agregar lo primero. */
export function EstadoVacio({ icono: Icono, titulo, texto, accion, className, compacto }: Props) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center rounded-tarjeta border border-dashed border-borde-control/60 px-6 text-center',
        compacto ? 'gap-2 py-6' : 'gap-3 py-10',
        className,
      )}
    >
      <span className="relative grid size-16 place-items-center" aria-hidden>
        <span className="absolute inset-0 rounded-2xl bg-marca/12 motion-safe:animate-pulse" />
        <span className="absolute inset-2 rounded-xl bg-superficie-elevada" />
        <Icono className="relative size-7 text-texto-marca" strokeWidth={2} />
      </span>
      <h3 className="font-display text-xl font-bold uppercase">{titulo}</h3>
      <p className="max-w-sm text-sm text-texto-secundario">{texto}</p>
      {accion && <div className="mt-2">{accion}</div>}
    </m.div>
  )
}
