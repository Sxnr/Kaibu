// Tarjeta en Hoy: los suplementos activos del día, para marcarlos con un toque. Sin suplementos no aparece.
import { Pill } from 'lucide-react'
import { Link } from 'react-router'
import { Casilla } from '@/components/ui/checkbox'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useSuplementos, useTomasDia } from '@/data/consultas'
import { cn } from '@/lib/utils'
import { alternarToma } from './tomas'

export function SuplementosHoy({ userId, fecha, comidas, className }: { userId: string; fecha: string; comidas: string[]; className?: string }) {
  const suplementos = useSuplementos(userId)
  const tomas = useTomasDia(userId, fecha)
  const activos = (suplementos ?? []).filter((s) => s.activo)
  if (!tomas || activos.length === 0) return null
  const hechos = activos.filter((s) => tomas.has(s.id)).length
  return (
    <Tarjeta className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Pill className="size-5 text-texto-marca" aria-hidden /> Suplementos
        </h2>
        <Link to="/suplementos" className="text-sm font-semibold text-texto-marca hover:underline">
          {hechos} de {activos.length} · Ver
        </Link>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {activos.map((s) => {
          const id = `hoy-toma-${s.id}`
          return (
            <li key={s.id} className="flex min-h-11 items-center gap-2">
              <Casilla id={id} checked={tomas.has(s.id)} onCheckedChange={() => void alternarToma(userId, s, fecha, comidas, tomas.get(s.id))} />
              <label htmlFor={id} className="cursor-pointer">
                {s.nombre}
                {s.hora && <span className="text-sm text-texto-secundario"> · {s.hora}</span>}
              </label>
            </li>
          )
        })}
      </ul>
    </Tarjeta>
  )
}
