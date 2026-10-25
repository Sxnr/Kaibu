import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Botón base (estilo shadcn/ui). Mínimo 44 px de alto para el toque.
const variantes = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap select-none transition-[transform,background-color,opacity] duration-150 motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-5',
  {
    variants: {
      variante: {
        primario: 'bg-marca text-sobre-marca hover:bg-marca-intensa',
        secundario: 'bg-superficie-elevada text-texto hover:bg-borde',
        contorno: 'border border-borde-control bg-transparent text-texto hover:bg-superficie-elevada',
        fantasma: 'bg-transparent text-texto hover:bg-superficie-elevada',
        enlace: 'bg-transparent text-texto-marca underline-offset-4 hover:underline px-0',
        peligro: 'bg-transparent text-texto-marca border border-borde-control hover:bg-superficie-elevada',
      },
      tamano: {
        md: 'min-h-12 px-5 text-base',
        sm: 'min-h-11 px-4 text-sm',
        icono: 'size-11 p-0',
        iconoGrande: 'size-12 p-0',
      },
      ancho: { completo: 'w-full', auto: '' },
    },
    defaultVariants: { variante: 'primario', tamano: 'md', ancho: 'auto' },
  },
)

export interface BotonProps extends ComponentProps<'button'>, VariantProps<typeof variantes> {
  asChild?: boolean
}

export function Boton({ className, variante, tamano, ancho, asChild, type, ...props }: BotonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(variantes({ variante, tamano, ancho }), className)}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    />
  )
}
