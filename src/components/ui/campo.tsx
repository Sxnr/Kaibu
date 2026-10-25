import { Label as LabelPrimitive } from 'radix-ui'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Etiqueta({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-semibold text-texto', className)} {...props} />
}

export function Entrada({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'min-h-12 w-full rounded-xl border border-borde-control bg-superficie px-4 text-base text-texto placeholder:text-texto-secundario',
        'aria-[invalid=true]:border-texto-marca focus-visible:border-foco',
        className,
      )}
      {...props}
    />
  )
}

interface CampoProps {
  etiqueta: ReactNode
  error?: string
  ayuda?: ReactNode
  className?: string
  /** Recibe el id y los atributos de accesibilidad para pasarlos al control. */
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Campo de formulario con etiqueta visible, ayuda y mensaje de error accesible. */
export function Campo({ etiqueta, error, ayuda, className, children }: CampoProps) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const describedBy = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Etiqueta htmlFor={id}>{etiqueta}</Etiqueta>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {ayuda && !error && (
        <p id={idAyuda} className="text-sm text-texto-secundario">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-sm font-medium text-texto-marca">
          {error}
        </p>
      )}
    </div>
  )
}
