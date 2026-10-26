import { Info, Plus, Search, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Maquetas decorativas de pantallas de Kaibu para la landing (números solo de ejemplo).

const tarjeta = 'rounded-tarjeta border border-borde bg-superficie p-5 text-texto shadow-[0_8px_30px_rgb(0_0_0/0.12)]'

/** Pantalla "Agregar": búsqueda y recientes a un toque. */
export function MaquetaAgregar({ className }: { className?: string }) {
  const recientes = [
    { n: 'Marraqueta', d: '1 unidad (100 g) · 275 kcal', fav: true },
    { n: 'Palta', d: '1/4 de palta (40 g) · 64 kcal', fav: true },
    { n: 'Huevo', d: '2 × 1 unidad (100 g) · 143 kcal', fav: false },
    { n: 'Pechuga de pollo cocida', d: '1 filete (120 g) · 198 kcal', fav: false },
  ]
  return (
    <div className={cn(tarjeta, className)}>
      <div className="flex gap-2">
        {['Desayuno', 'Almuerzo', 'Once'].map((c, i) => (
          <span
            key={c}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold',
              i === 0 ? 'border-marca bg-marca text-sobre-marca' : 'border-borde text-texto-secundario',
            )}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-borde-control px-3 py-2.5 text-sm text-texto-secundario">
        <Search className="size-4" />
        marraq|
      </div>
      <p className="rotulo mt-4">Recientes</p>
      <ul className="mt-1 divide-y divide-borde">
        {recientes.map((r) => (
          <li key={r.n} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {r.n}
                {r.fav && <Star className="size-3 fill-carbos text-carbos" />}
              </span>
              <span className="block truncate text-xs text-texto-secundario">{r.d}</span>
            </span>
            <span className="grid size-8 place-items-center rounded-lg bg-superficie-elevada">
              <Plus className="size-4" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Pantalla "Tu plan": meta, macros y la explicación de cada número. */
export function MaquetaPlan({ className }: { className?: string }) {
  const macros = [
    { n: 'Proteína', g: '180 g', pct: 31, c: 'bg-proteina' },
    { n: 'Carbos', g: '246 g', pct: 42, c: 'bg-carbos' },
    { n: 'Grasas', g: '72 g', pct: 27, c: 'bg-grasas' },
  ]
  return (
    <div className={cn(tarjeta, className)}>
      <p className="rotulo">Meta diaria · Déficit</p>
      <p className="mt-1">
        <span className="num text-6xl leading-none font-bold text-numero-marca">2.345</span>
        <span className="num text-xl text-texto-secundario"> kcal</span>
      </p>
      <p className="mt-2 flex gap-1.5 text-xs text-texto-secundario">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Restamos 550 kcal al día para bajar 0,5 kg por semana (1 kg ≈ 7.700 kcal).
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {macros.map((m) => (
          <li key={m.n}>
            <div className="flex justify-between text-sm">
              <span>{m.n}</span>
              <span className="num font-bold">
                {m.g} <span className="font-normal text-texto-secundario">({m.pct} %)</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-superficie-elevada">
              <div className={cn('h-full rounded-full', m.c)} style={{ width: `${m.pct * 2}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-superficie-elevada p-2.5">
          <p className="text-texto-secundario">Mantenimiento</p>
          <p className="num text-base font-bold">2.895 kcal</p>
        </div>
        <div className="rounded-lg bg-superficie-elevada p-2.5">
          <p className="text-texto-secundario">Rango aceptable</p>
          <p className="num text-base font-bold">2.111 – 2.580</p>
        </div>
      </div>
    </div>
  )
}
