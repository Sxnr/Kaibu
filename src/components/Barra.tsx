import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Props {
  /** 0 a 100 */
  porcentaje: number
  etiqueta: string
  /** Texto para lectores de pantalla, ej. "92 de 175 gramos". */
  texto?: string
  colorClase?: string
  className?: string
  alto?: 'sm' | 'md'
}

/** Barra de progreso que se llena con animación. */
export function Barra({ porcentaje, etiqueta, texto, colorClase = 'bg-marca', className, alto = 'sm' }: Props) {
  const reducir = useReducedMotion()
  const pct = Math.max(0, Math.min(100, porcentaje))
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-valuetext={texto}
      className={cn('w-full overflow-hidden rounded-full bg-superficie-elevada', alto === 'sm' ? 'h-2' : 'h-3', className)}
    >
      <m.div
        className={cn('h-full rounded-full', colorClase)}
        initial={reducir ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reducir ? 0 : 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </div>
  )
}
