import { Check, Flame, Minus, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

// Vista previa decorativa de Kaibu (tarjetas "flotantes"). Los números son solo de ejemplo
// para mostrar la app en la landing y en el panel de marca; no son datos de ningún usuario.

function TarjetaKcal({ className }: { className?: string }) {
  const macros = [
    { n: 'Proteína', v: '92', m: '175', pct: 52, c: 'bg-proteina' },
    { n: 'Carbos', v: '140', m: '265', pct: 53, c: 'bg-carbos' },
    { n: 'Grasas', v: '38', m: '65', pct: 58, c: 'bg-grasas' },
  ]
  return (
    <div className={cn('rounded-tarjeta border border-borde bg-superficie/90 p-5 backdrop-blur', className)}>
      <div className="flex items-center justify-between">
        <p className="rotulo">Kcal restantes</p>
        <span className="inline-flex items-center gap-1 rounded-full border border-borde px-2.5 py-1 text-xs font-semibold">
          <Flame className="size-3.5 text-texto-marca" aria-hidden />
          <span className="num text-sm">12</span> días
        </span>
      </div>
      <p className="num mt-1 text-7xl leading-none font-bold text-numero-marca">1.240</p>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-superficie-elevada">
        <div className="h-full w-[47%] rounded-full bg-marca" />
      </div>
      <p className="mt-2 text-xs text-texto-secundario">
        <span className="num text-sm font-semibold text-texto">1.110</span> consumidas de 2.350
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {macros.map((m) => (
          <div key={m.n}>
            <p className="text-[11px] text-texto-secundario">{m.n}</p>
            <p className="num text-base font-bold">
              {m.v}
              <span className="text-[11px] font-normal text-texto-secundario"> / {m.m} g</span>
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-elevada">
              <div className={cn('h-full rounded-full', m.c)} style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TarjetaPeso({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-tarjeta border border-borde bg-superficie/90 p-5 backdrop-blur', className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Peso · 14 días</p>
        <p className="text-xs font-semibold text-exito">−0,7 kg/sem</p>
      </div>
      <p className="mt-1">
        <span className="num text-4xl font-bold">91,1</span>
        <span className="text-sm text-texto-secundario"> kg · meta 83</span>
      </p>
      <svg viewBox="0 0 200 60" className="mt-2 h-14 w-full" aria-hidden>
        <polyline
          points="0,14 18,8 36,16 54,12 72,22 90,18 108,26 126,24 144,34 162,30 180,40 200,44"
          fill="none"
          stroke="var(--texto-secundario)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <polyline points="0,12 36,13 72,18 108,23 144,30 180,37 200,42" fill="none" stroke="var(--marca-intensa)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="200" cy="42" r="4" fill="var(--marca-intensa)" />
      </svg>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-superficie-elevada">
        <div className="h-full w-[38%] rounded-full bg-marca" />
      </div>
      <p className="mt-1.5 text-xs text-texto-secundario">38 % logrado · llegas en ~14 semanas</p>
    </div>
  )
}

function TarjetaSemana({ className }: { className?: string }) {
  const dias: { d: string; e: 'ok' | 'fuera' | 'nada' | 'hoy' }[] = [
    { d: 'L', e: 'ok' },
    { d: 'M', e: 'ok' },
    { d: 'M', e: 'fuera' },
    { d: 'J', e: 'ok' },
    { d: 'V', e: 'ok' },
    { d: 'S', e: 'hoy' },
    { d: 'D', e: 'nada' },
  ]
  return (
    <div className={cn('rounded-tarjeta border border-borde bg-superficie/90 p-5 backdrop-blur', className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">Semana</p>
        <p className="text-xs text-texto-secundario">4 de 6 cumplidos</p>
      </div>
      <ul className="mt-3 grid grid-cols-7 gap-1.5">
        {dias.map((x, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-texto-secundario">{x.d}</span>
            <span
              className={cn(
                'grid size-8 place-items-center rounded-lg',
                x.e === 'ok' && 'bg-exito/15 text-exito',
                x.e === 'fuera' && 'bg-alerta/15 text-alerta',
                x.e === 'hoy' && 'border-2 border-marca',
                x.e === 'nada' && 'bg-superficie-elevada text-texto-secundario',
              )}
            >
              {x.e === 'ok' && <Check className="size-4" strokeWidth={3} />}
              {x.e === 'fuera' && <TriangleAlert className="size-3.5" strokeWidth={2.5} />}
              {x.e === 'hoy' && <span className="size-2 rounded-full bg-marca" />}
              {x.e === 'nada' && <Minus className="size-3.5" />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Composición de tarjetas flotantes que muestra cómo se ve Kaibu. */
export function VistaPreviaApp({ className, compacta }: { className?: string; compacta?: boolean }) {
  return (
    <div role="img" aria-label="Vista previa de Kaibu: kcal restantes, avance de peso y semana" className={cn('relative', className)}>
      <div aria-hidden className="relative grid gap-4">
        <TarjetaKcal className="flotar relative z-10 shadow-tarjeta" />
        {!compacta && (
          <div className="grid gap-4 sm:grid-cols-2 sm:pl-10">
            <TarjetaPeso className="flotar-lento shadow-tarjeta" />
            <TarjetaSemana className="flotar shadow-tarjeta [animation-delay:-2s]" />
          </div>
        )}
        {compacta && <TarjetaSemana className="flotar-lento ml-10 shadow-tarjeta" />}
      </div>
    </div>
  )
}
