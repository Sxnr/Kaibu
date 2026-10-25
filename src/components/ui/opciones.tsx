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
}

/** Grupo de opciones como tarjetas grandes (accesible con teclado y lector de pantalla). */
export function Opciones<T extends string>({ valor, alCambiar, opciones, etiqueta, columnas = 1, className, invalido }: OpcionesProps<T>) {
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
          )}
        >
          {o.icono && <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-superficie-elevada text-texto-marca">{o.icono}</span>}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{o.titulo}</span>
            {o.detalle && <span className="text-sm text-texto-secundario">{o.detalle}</span>}
          </span>
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-borde-control group-data-[state=checked]:border-marca group-data-[state=checked]:bg-marca"
            aria-hidden
          >
            <Check className="size-3.5 text-sobre-marca opacity-0 group-data-[state=checked]:opacity-100" strokeWidth={3} />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
