import { cn } from '@/lib/utils'

/** Formas de la K (lienzo 512). Misma geometría que scripts/brand.mjs. */
export function FormaK({ className }: { className?: string }) {
  return (
    <g className={className}>
      <rect x="124" y="118" width="78" height="276" />
      <polygon points="135.4,315.4 190.6,370.6 357.6,203.6 302.4,148.4" />
      <polygon points="388,118 388,262 244,118" />
      <polygon points="267.3,245 386.2,394 283.8,394 204.8,295" />
    </g>
  )
}

/** Ícono de Kaibu: K blanca sobre cuadrado carmesí. */
export function IconoKaibu({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('size-9', className)} role={titulo ? 'img' : undefined} aria-hidden={titulo ? undefined : true} aria-label={titulo}>
      <rect width="512" height="512" rx="112" fill="#B3202A" />
      <g fill="#FFFFFF" transform="translate(256 256) scale(0.92) translate(-256 -256)">
        <FormaK />
      </g>
    </svg>
  )
}

/** Logotipo horizontal: ícono + "KAIBU". */
export function Logotipo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <IconoKaibu className="size-8" />
      <span className="font-display text-2xl font-bold tracking-[0.12em] text-texto">KAIBU</span>
    </span>
  )
}
