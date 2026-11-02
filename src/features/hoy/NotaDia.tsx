import { NotebookPen } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { DiaRegistro } from '@/data/db'
import { guardar } from '@/data/escritura'
import { formatoNumero } from '@/domain/format/formato'
import { diaVacio } from './registroDia'

const MAX_NOTA = 1000

interface Props {
  userId: string
  fecha: string
  dia: DiaRegistro | null
}

/** Nota del día (RF-27): se guarda sola al salir del cuadro; se puede borrar y deshacer. */
export function NotaDia({ userId, fecha, dia }: Props) {
  const guardada = dia?.nota ?? ''
  const [texto, setTexto] = useState(guardada)
  const id = useId()

  // Si cambia el día o llega una nota sincronizada, se muestra la guardada.
  useEffect(() => setTexto(guardada), [guardada, fecha])

  const escribir = async (nota: string | null, mensaje: string) => {
    const anterior = dia ?? diaVacio(userId, fecha)
    await guardar('dias', { ...anterior, nota })
    toast(mensaje, { id: 'nota', action: { label: 'Deshacer', onClick: () => void guardar('dias', anterior) } })
  }

  const alSalir = () => {
    const limpia = texto.trim()
    if (limpia === guardada) return
    void escribir(limpia || null, limpia ? 'Nota guardada' : 'Nota borrada')
  }

  return (
    <Tarjeta className="flex h-full flex-col gap-2">
      <label htmlFor={id} className="flex items-center gap-2 font-semibold">
        <NotebookPen className="size-5 text-texto-secundario" aria-hidden /> Nota del día
      </label>
      <textarea
        id={id}
        value={texto}
        maxLength={MAX_NOTA}
        rows={3}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={alSalir}
        placeholder="Cómo dormiste, cómo te sentiste, si entrenaste…"
        aria-describedby={`${id}-cuenta`}
        className="min-h-24 w-full resize-y rounded-xl border border-borde-control bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario focus-visible:border-foco"
      />
      <div className="flex items-center justify-between gap-3">
        <p id={`${id}-cuenta`} className="text-sm text-texto-secundario">
          {formatoNumero(texto.length)} de {formatoNumero(MAX_NOTA)} caracteres · se guarda al salir del cuadro
        </p>
        {guardada && (
          <Boton
            variante="enlace"
            tamano="sm"
            onClick={() => {
              setTexto('')
              void escribir(null, 'Nota borrada')
            }}
          >
            Borrar nota
          </Boton>
        )}
      </div>
    </Tarjeta>
  )
}
