import { Scale } from 'lucide-react'
import { Link } from 'react-router'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Peso } from '@/data/db'
import { promedioMovil7 } from '@/domain/calc/peso'
import { formatoNumero } from '@/domain/format/formato'

interface Props {
  pesos: Peso[]
  fecha: string
  pesoMeta: number | null
  alRegistrar: () => void
}

/** Peso del día con el promedio de 7 días, y registro en un toque. */
export function TarjetaPeso({ pesos, fecha, pesoMeta, alRegistrar }: Props) {
  const delDia = pesos.find((p) => p.fecha === fecha)
  const promedio = promedioMovil7(pesos.filter((p) => p.fecha <= fecha).map((p) => ({ fecha: p.fecha, kg: p.kg }))).at(-1)
  return (
    <Tarjeta className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Peso</h2>
        <Link to="/progreso" className="text-sm font-semibold text-texto-marca underline-offset-2 hover:underline">
          Ver progreso
        </Link>
      </div>
      {promedio ? (
        <p>
          <span className="num text-5xl leading-none font-bold">{formatoNumero(promedio.promedio, 1)}</span>
          <span className="text-texto-secundario"> kg promedio 7 días</span>
          {pesoMeta && <span className="block text-sm text-texto-secundario">Meta: {formatoNumero(pesoMeta, 1)} kg</span>}
        </p>
      ) : (
        <p className="text-sm text-texto-secundario">Aún no registras tu peso.</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 rounded-xl bg-superficie-elevada p-3">
        <span className="flex items-center gap-2 text-sm">
          <Scale className="size-5 text-texto-secundario" aria-hidden />
          {delDia ? (
            <span>
              Hoy: <span className="num text-lg font-bold">{formatoNumero(delDia.kg, 1)} kg</span>
            </span>
          ) : (
            'Sin peso este día'
          )}
        </span>
        <Boton tamano="sm" variante={delDia ? 'secundario' : 'primario'} onClick={alRegistrar}>
          {delDia ? 'Editar' : 'Registrar'}
        </Boton>
      </div>
    </Tarjeta>
  )
}
