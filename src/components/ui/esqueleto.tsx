import { cn } from '@/lib/utils'

/** Bloque gris animado mientras carga (nunca pantallas en blanco). */
export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn('esqueleto h-4 w-full', className)} aria-hidden />
}

export function PantallaCargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4" role="status" aria-live="polite">
      <span className="sr-only">{texto}</span>
      <Esqueleto className="h-10 w-40" />
      <Esqueleto className="h-40 rounded-tarjeta" />
      <div className="grid grid-cols-3 gap-3">
        <Esqueleto className="h-16 rounded-tarjeta" />
        <Esqueleto className="h-16 rounded-tarjeta" />
        <Esqueleto className="h-16 rounded-tarjeta" />
      </div>
      <Esqueleto className="h-20 rounded-tarjeta" />
      <Esqueleto className="h-20 rounded-tarjeta" />
    </div>
  )
}
