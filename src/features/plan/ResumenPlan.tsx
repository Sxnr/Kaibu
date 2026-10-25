import { Droplets, Info } from 'lucide-react'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { Barra } from '@/components/Barra'
import { NumeroAnimado } from '@/components/NumeroAnimado'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { PlanCalculado } from '@/domain/calc/plan'
import { formatoNumero } from '@/domain/format/formato'

const contenedor = { oculto: {}, visible: { transition: { staggerChildren: 0.08 } } }
const elemento = { oculto: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export function Explicacion({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex gap-1.5 text-sm text-texto-secundario">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

/** Resumen del plan: kcal, macros, reparto por comida y agua, explicando cada número. */
export function ResumenPlan({ plan }: { plan: PlanCalculado }) {
  const macros = [
    { nombre: 'Proteína', g: plan.proteinaG, pct: plan.pct.proteina, color: 'bg-proteina', exp: plan.explicaciones.proteina },
    { nombre: 'Carbos', g: plan.carbosG, pct: plan.pct.carbos, color: 'bg-carbos', exp: plan.explicaciones.carbos },
    { nombre: 'Grasas', g: plan.grasasG, pct: plan.pct.grasas, color: 'bg-grasas', exp: plan.explicaciones.grasas },
  ]
  return (
    <m.div className="grid gap-4 lg:grid-cols-2" variants={contenedor} initial="oculto" animate="visible">
      <m.div variants={elemento} className="lg:col-span-2">
        <Tarjeta>
          <p className="rotulo">Meta diaria</p>
          <p className="mt-1 flex items-baseline gap-2">
            <NumeroAnimado valor={plan.kcal} className="num text-7xl leading-none font-bold text-numero-marca" />
            <span className="num text-2xl text-texto-secundario">kcal</span>
          </p>
          <Explicacion>{plan.explicaciones.kcal}</Explicacion>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-superficie-elevada p-3">
              <dt className="text-sm text-texto-secundario">Mantenimiento estimado</dt>
              <dd className="num text-2xl font-bold">{formatoNumero(plan.mantenimiento)} kcal</dd>
              <dd className="text-sm text-texto-secundario">{plan.explicaciones.mantenimiento}</dd>
            </div>
            <div className="rounded-xl bg-superficie-elevada p-3">
              <dt className="text-sm text-texto-secundario">Rango aceptable</dt>
              <dd className="num text-2xl font-bold">
                {formatoNumero(plan.rango.min)} – {formatoNumero(plan.rango.max)}
              </dd>
              <dd className="text-sm text-texto-secundario">{plan.explicaciones.rango}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-texto-secundario">{plan.explicaciones.basal}</p>
        </Tarjeta>
      </m.div>

      <m.div variants={elemento}>
        <Tarjeta className="h-full">
          <h2 className="font-semibold">Macros</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {macros.map((m) => (
              <li key={m.nombre}>
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{m.nombre}</span>
                  <span>
                    <span className="num text-xl font-bold">{formatoNumero(m.g)} g</span>{' '}
                    <span className="text-sm text-texto-secundario">({m.pct} %)</span>
                  </span>
                </div>
                <Barra porcentaje={m.pct} etiqueta={`${m.nombre}: ${m.pct} % de las calorías`} colorClase={m.color} className="mt-1.5" />
                <p className="mt-1 text-sm text-texto-secundario">{m.exp}</p>
              </li>
            ))}
          </ul>
          {plan.carbosInsuficientes && (
            <p className="mt-3 text-sm font-medium text-alerta">Las calorías no alcanzan para cubrir proteína y grasas. Revisa tu meta.</p>
          )}
        </Tarjeta>
      </m.div>

      <m.div variants={elemento} className="flex flex-col gap-4">
        <Tarjeta>
          <h2 className="font-semibold">Reparto por comida</h2>
          <ul className="mt-3 divide-y divide-borde">
            {plan.comidas.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <span>{c.nombre}</span>
                <span>
                  <span className="num text-xl font-bold">{formatoNumero(c.kcal)}</span>{' '}
                  <span className="text-sm text-texto-secundario">kcal · {c.pct} %</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm text-texto-secundario">{plan.explicaciones.comidas}</p>
        </Tarjeta>
        <Tarjeta className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-superficie-elevada text-proteina">
            <Droplets aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">
              Agua: <span className="num text-xl">{formatoNumero(plan.aguaMl / 1000, 1)} L</span> al día
            </h2>
            <p className="text-sm text-texto-secundario">{plan.explicaciones.agua}</p>
          </div>
        </Tarjeta>
      </m.div>
    </m.div>
  )
}
