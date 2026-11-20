// Botón chico "¿Cómo se usa?": abre una guía corta de la sección, solo cuando la persona lo pide.
import { CircleHelp, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { Boton } from '@/components/ui/button'
import { Hoja } from '@/components/ui/hoja'
import { GUIAS, type ClaveGuia } from '@/features/ayuda/guias'
import { cn } from '@/lib/utils'

export function ComoSeUsa({ guia, className }: { guia: ClaveGuia; className?: string }) {
  const [abierta, setAbierta] = useState(false)
  const g = GUIAS[guia]
  return (
    <>
      <Boton
        variante="fantasma"
        tamano="sm"
        onClick={() => setAbierta(true)}
        className={cn('gap-1.5 px-2.5 text-texto-secundario', className)}
        aria-haspopup="dialog"
      >
        <CircleHelp aria-hidden className="size-4" />
        <span>¿Cómo se usa?</span>
      </Boton>
      <Hoja abierta={abierta} alCambiar={setAbierta} titulo={g.titulo}>
        <ol className="flex flex-col gap-3">
          {g.pasos.map((p, i) => (
            <li key={p} className="flex gap-3">
              <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-superficie-elevada text-sm font-bold text-texto-marca" aria-hidden>
                {i + 1}
              </span>
              <p className="pt-0.5">{p}</p>
            </li>
          ))}
        </ol>
        {'consejo' in g && g.consejo && (
          <p className="mt-4 flex gap-2 rounded-xl bg-superficie-elevada p-3 text-sm">
            <Lightbulb aria-hidden className="size-4 shrink-0 text-texto-marca" />
            {g.consejo}
          </p>
        )}
        <Boton ancho="completo" className="mt-5" onClick={() => setAbierta(false)}>
          Entendido
        </Boton>
      </Hoja>
    </>
  )
}
