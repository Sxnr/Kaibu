import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { nutrientesPorGramos } from '@/domain/calc/dia'
import type { Alimento } from '@/domain/alimentos/tipos'
import { formatoNumero, parseDecimal } from '@/domain/format/formato'
import { cn } from '@/lib/utils'
import { gramosDe, type ModoCantidad } from './registrar'

interface Props {
  alimento: Alimento | null
  abierta: boolean
  alCambiar: (v: boolean) => void
  nombreComida: string
  esFavorito: boolean
  alAlternarFavorito: (a: Alimento) => void
  alAgregar: (a: Alimento, modo: ModoCantidad, cantidad: number) => void
}

/** Ficha del alimento: cantidad en gramos o porciones con cálculo automático de kcal y macros. */
export function FichaAlimento({ alimento, abierta, alCambiar, nombreComida, esFavorito, alAlternarFavorito, alAgregar }: Props) {
  const [modo, setModo] = useState<ModoCantidad>('g')
  const [texto, setTexto] = useState('100')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!alimento) return
    setModo(alimento.porcion ? 'porcion' : 'g')
    setTexto(alimento.porcion ? '1' : '100')
    setError(undefined)
  }, [alimento])

  if (!alimento) return null
  const cantidad = parseDecimal(texto) ?? 0
  const gramos = gramosDe(alimento, modo, cantidad)
  const n = nutrientesPorGramos(alimento, gramos)

  const agregar = () => {
    if (cantidad <= 0 || gramos > 5000) {
      setError(modo === 'g' ? 'Escribe una cantidad entre 1 y 5.000 g.' : 'Escribe cuántas porciones (ej. 1 o 1,5).')
      return
    }
    alAgregar(alimento, modo, cantidad)
  }

  return (
    <Hoja
      abierta={abierta}
      alCambiar={alCambiar}
      titulo={alimento.nombre}
      descripcion={`${formatoNumero(alimento.kcal)} kcal por 100 g${alimento.marca ? ` · ${alimento.marca}` : ''}`}
    >
      <div className="flex flex-col gap-4">
        {alimento.porcion && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-superficie-elevada p-1" role="radiogroup" aria-label="Unidad">
            {(['porcion', 'g'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={modo === m}
                onClick={() => {
                  setModo(m)
                  setTexto(m === 'g' ? String(Math.round(gramos) || alimento.porcion!.g) : '1')
                }}
                className={cn('min-h-11 rounded-lg text-sm font-semibold', modo === m ? 'bg-superficie shadow-tarjeta' : 'text-texto-secundario')}
              >
                {m === 'g' ? 'Gramos' : `Porciones (${alimento.porcion!.nombre})`}
              </button>
            ))}
          </div>
        )}
        <Campo
          etiqueta={modo === 'g' ? 'Cantidad (g o ml)' : 'Número de porciones'}
          error={error}
          ayuda={modo === 'porcion' && alimento.porcion ? `1 porción = ${alimento.porcion.nombre} ≈ ${formatoNumero(alimento.porcion.g)} g` : undefined}
        >
          {(a) => <Entrada inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} className="num text-2xl" {...a} />}
        </Campo>

        <dl className="grid grid-cols-4 gap-2 rounded-2xl bg-superficie-elevada p-3 text-center" aria-live="polite">
          {[
            { t: 'Kcal', v: formatoNumero(n.kcal), c: 'text-numero-marca' },
            { t: 'Proteína', v: `${formatoNumero(n.proteina, 1)} g`, c: '' },
            { t: 'Carbos', v: `${formatoNumero(n.carbos, 1)} g`, c: '' },
            { t: 'Grasas', v: `${formatoNumero(n.grasas, 1)} g`, c: '' },
          ].map((x) => (
            <div key={x.t}>
              <dt className="text-xs text-texto-secundario">{x.t}</dt>
              <dd className={cn('num text-xl font-bold', x.c)}>{x.v}</dd>
            </div>
          ))}
        </dl>

        {alimento.fuente && <p className="text-xs text-texto-secundario">Fuente: {alimento.fuente}</p>}

        <div className="flex gap-3">
          <Boton
            variante="secundario"
            tamano="iconoGrande"
            onClick={() => alAlternarFavorito(alimento)}
            aria-pressed={esFavorito}
            aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star className={cn(esFavorito && 'fill-carbos text-carbos')} aria-hidden />
          </Boton>
          <Boton ancho="completo" onClick={agregar}>
            Agregar a {nombreComida}
          </Boton>
        </div>
      </div>
    </Hoja>
  )
}
