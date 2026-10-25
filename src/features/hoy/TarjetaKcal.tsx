import { Barra } from '@/components/Barra'
import { NumeroAnimado } from '@/components/NumeroAnimado'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Nutrientes } from '@/domain/calc/dia'
import type { PlanCalculado } from '@/domain/calc/plan'
import { formatoNumero } from '@/domain/format/formato'

/** Tarjeta principal: kcal restantes (cuenta hacia arriba/abajo), consumidas, meta, rango y macros. */
export function TarjetaKcal({ plan, total }: { plan: PlanCalculado; total: Nutrientes }) {
  const restantes = plan.kcal - total.kcal
  const sobre = restantes < 0
  const enRango = total.kcal >= plan.rango.min && total.kcal <= plan.rango.max
  const macros = [
    { nombre: 'Proteína', valor: total.proteina, meta: plan.proteinaG, color: 'bg-proteina' },
    { nombre: 'Carbos', valor: total.carbos, meta: plan.carbosG, color: 'bg-carbos' },
    { nombre: 'Grasas', valor: total.grasas, meta: plan.grasasG, color: 'bg-grasas' },
  ]
  return (
    <Tarjeta className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
      <div>
        <p className="rotulo">{sobre ? 'Kcal sobre la meta' : 'Kcal restantes'}</p>
        <p className="mt-1" aria-live="polite">
          <NumeroAnimado valor={Math.abs(restantes)} className="num text-7xl leading-none font-bold text-numero-marca sm:text-8xl" />
          <span className="sr-only"> kilocalorías {sobre ? 'sobre la meta' : 'restantes'}</span>
        </p>
        <Barra
          porcentaje={(total.kcal / plan.kcal) * 100}
          etiqueta="Calorías consumidas"
          texto={`${formatoNumero(total.kcal)} de ${formatoNumero(plan.kcal)} kcal`}
          alto="md"
          className="mt-4"
        />
        <p className="mt-2 text-sm text-texto-secundario">
          <span className="num text-base font-semibold text-texto">{formatoNumero(total.kcal)}</span> consumidas de{' '}
          <span className="num text-base">{formatoNumero(plan.kcal)}</span> · rango {formatoNumero(plan.rango.min)}–{formatoNumero(plan.rango.max)}
          {total.kcal > 0 && <span className="font-medium text-texto"> · {enRango ? 'Dentro del rango' : total.kcal < plan.rango.min ? 'Falta' : 'Sobre el rango'}</span>}
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:content-center">
        {macros.map((m) => (
          <li key={m.nombre}>
            <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between">
              <span className="text-xs text-texto-secundario lg:text-sm">{m.nombre}</span>
              <span>
                <span className="num text-xl font-bold">{formatoNumero(m.valor)}</span>
                <span className="text-xs text-texto-secundario"> / {formatoNumero(m.meta)} g</span>
              </span>
            </div>
            <Barra
              porcentaje={(m.valor / m.meta) * 100}
              etiqueta={m.nombre}
              texto={`${formatoNumero(m.valor)} de ${formatoNumero(m.meta)} gramos`}
              colorClase={m.color}
              className="mt-1.5"
            />
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}
