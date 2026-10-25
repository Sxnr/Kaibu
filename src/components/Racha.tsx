import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Chip de racha: días seguidos dentro del rango. */
export function Racha({ dias, className }: { dias: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 text-sm font-semibold',
        className,
      )}
    >
      <Flame className={cn('size-4', dias > 0 ? 'text-texto-marca' : 'text-texto-secundario')} aria-hidden />
      <span className="num text-base">{dias}</span>
      <span className="text-texto-secundario">{dias === 1 ? 'día' : 'días'}</span>
      <span className="sr-only">de racha</span>
    </span>
  )
}
