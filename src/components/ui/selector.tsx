import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Lista desplegable nativa (accesible y cómoda en celular). */
export function Selector({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'min-h-12 w-full appearance-none rounded-xl border border-borde-control bg-superficie pr-11 pl-4 text-base text-texto aria-[invalid=true]:border-texto-marca',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-texto-secundario" aria-hidden />
    </div>
  )
}
