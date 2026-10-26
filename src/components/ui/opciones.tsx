import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Opcion<T extends string> {
  valor: T
  titulo: ReactNode
  detalle?: ReactNode
  icono?: ReactNode
}

interface OpcionesProps<T extends string> {
  valor: T | undefined
  alCambiar: (v: T) => void
  opciones: Opcion<T>[]
  etiqueta: string
  columnas?: 1 | 2 | 3 | 4
  className?: string
  invalido?: boolean
  /** En PC (lg) cada opción se muestra como tarjeta vertical: ícono arriba y texto debajo. */
  tarjetaEnPc?: boolean
}

/** Grupo de opciones como tarjetas grandes (accesible con teclado y lector de pantalla). */
export function Opciones<T extends string>({
  valor,
  alCambiar,
  opciones,
  etiqueta,
  columnas = 1,
  className,
  invalido,
  tarjetaEnPc,
}: OpcionesProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      value={valor ?? ''}
      onValueChange={(v) => alCambiar(v as T)}
      aria-label={etiqueta}
      aria-invalid={invalido}
      className={cn(
        'grid gap-3',
        columnas === 2 && 'grid-cols-2',
        columnas === 3 && 'grid-cols-3',
        columnas === 4 && 'grid-cols-4',
        className,
      )}
    >
      {opciones.map((o) => (
        <RadioGroupPrimitive.Item
          key={o.valor}
          value={o.valor}
          className={cn(
            'group flex min-h-14 items-center gap-3 rounded-2xl border-2 border-borde bg-superficie p-4 text-left transition-colors',
            'hover:border-borde-control data-[state=checked]:border-marca data-[state=checked]:bg-superficie-elevada',
            tarjetaEnPc && 'lg:relative lg:flex-col lg:items-start lg:gap-4 lg:p-6',
          )}
        >
          {o.icono && (
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl bg-superficie-elevada text-texto-marca',
                tarjetaEnPc && 'lg:size-12 lg:group-data-[state=checked]:bg-superficie',
              )}
            >
              {o.icono}
            </span>
          )}
          <span className={cn('flex min-w-0 flex-1 flex-col', tarjetaEnPc && 'lg:gap-1 lg:pr-6')}>
            <span className={cn('font-semibold', tarjetaEnPc && 'lg:text-lg')}>{o.titulo}</span>
            {o.detalle && <span className="text-sm text-texto-secundario">{o.detalle}</span>}
          </span>
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full border-2 border-borde-control group-data-[state=checked]:border-marca group-data-[state=checked]:bg-marca',
              tarjetaEnPc && 'lg:absolute lg:top-5 lg:right-5',
            )}
            aria-hidden
          >
            <Check className="size-3.5 text-sobre-marca opacity-0 group-data-[state=checked]:opacity-100" strokeWidth={3} />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
