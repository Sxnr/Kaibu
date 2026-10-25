import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HojaProps {
  abierta: boolean
  alCambiar: (abierta: boolean) => void
  titulo: string
  descripcion?: string
  children: ReactNode
  className?: string
}

/**
 * Hoja inferior (en PC se muestra centrada). Solo se abre por acción del usuario;
 * nunca interrumpe por sí sola. Cierra con Escape, tocando fuera o con la X.
 */
export function Hoja({ abierta, alCambiar, titulo, descripcion, children, className }: HojaProps) {
  return (
    <DialogPrimitive.Root open={abierta} onOpenChange={alCambiar}>
      <AnimatePresence>
        {abierta && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-40 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => {
                // Lleva el foco al primer campo (si hay) para escribir de inmediato.
                const campo = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('input, select, textarea')
                if (campo) {
                  e.preventDefault()
                  campo.focus()
                }
              }}
            >
              <m.div
                className={cn(
                  'fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-borde bg-superficie p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-tarjeta',
                  'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-full lg:max-w-lg lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl',
                  className,
                )}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-borde lg:hidden" aria-hidden />
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <DialogPrimitive.Title className="font-display text-2xl font-bold uppercase">{titulo}</DialogPrimitive.Title>
                    {descripcion ? (
                      <DialogPrimitive.Description className="mt-1 text-sm text-texto-secundario">{descripcion}</DialogPrimitive.Description>
                    ) : (
                      <DialogPrimitive.Description className="sr-only">{titulo}</DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close
                    className="-mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-xl text-texto-secundario hover:bg-superficie-elevada"
                    aria-label="Cerrar"
                  >
                    <X className="size-5" aria-hidden />
                  </DialogPrimitive.Close>
                </div>
                {children}
              </m.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
