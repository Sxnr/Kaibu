import { CalendarClock, Copy } from 'lucide-react'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Hoja } from '@/components/ui/hoja'
import type { RegistroComida } from '@/data/db'
import { sumarNutrientes } from '@/domain/calc/dia'
import type { ComidaReparto } from '@/domain/calc/types'
import { formatoNumero } from '@/domain/format/formato'

interface Props {
  abierta: boolean
  alCambiar: (v: boolean) => void
  registrosAyer: RegistroComida[]
  comidas: ComidaReparto[]
  comidaDestino: ComidaReparto
  alCopiar: (registros: RegistroComida[], comidaDestino?: string) => void
}

/** Copiar una comida o el día completo de ayer. */
export function CopiarAyer({ abierta, alCambiar, registrosAyer, comidas, comidaDestino, alCopiar }: Props) {
  const conRegistros = comidas.map((c) => ({ ...c, lista: registrosAyer.filter((r) => r.comida === c.id) })).filter((c) => c.lista.length > 0)
  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo="Copiar de ayer" descripcion="Repite lo que comiste ayer en un toque.">
      {registrosAyer.length === 0 ? (
        <EstadoVacio compacto icono={CalendarClock} titulo="Ayer sin registros" texto="Cuando registres comidas, podrás copiarlas al día siguiente desde aquí." />
      ) : (
        <div className="flex flex-col gap-3">
          {conRegistros.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-borde p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.nombre}</p>
                <p className="truncate text-sm text-texto-secundario">{c.lista.map((r) => r.nombre).join(', ')}</p>
              </div>
              <span className="num text-lg font-bold">{formatoNumero(sumarNutrientes(c.lista).kcal)}</span>
              <Boton tamano="sm" variante="secundario" onClick={() => alCopiar(c.lista, comidaDestino.id)} aria-label={`Copiar ${c.nombre} de ayer a ${comidaDestino.nombre}`}>
                <Copy aria-hidden /> A {comidaDestino.nombre.toLowerCase()}
              </Boton>
            </div>
          ))}
          <Boton ancho="completo" onClick={() => alCopiar(registrosAyer)}>
            <Copy aria-hidden /> Copiar el día completo ({formatoNumero(sumarNutrientes(registrosAyer).kcal)} kcal)
          </Boton>
        </div>
      )}
    </Hoja>
  )
}
