import { CalendarCheck, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Barra } from '@/components/Barra'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useRegistrosRango } from '@/data/consultas'
import { describirResumen, diasDelPeriodo, diasNutricion, resumenPeriodo, type Periodo } from '@/domain/calc/resumenSemanal'
import { fechaCorta, formatoNumero, inicialDia, numeroDia } from '@/domain/format/formato'
import { cn } from '@/lib/utils'
import { CompartirProgreso, type DatosFase } from './CompartirProgreso'

interface Metas {
  kcal: number
  rango: { min: number; max: number }
  proteinaG: number
  carbosG: number
  grasasG: number
}

const PERIODOS: { id: Periodo; texto: string }[] = [
  { id: 'semana', texto: 'Semana' },
  { id: 'mes', texto: 'Mes' },
]

// Proporción pensada para celular: en PC el gráfico tiene un alto máximo.
const ANCHO = 400
const ALTO = 190
const M = { arriba: 10, abajo: 26, izq: 48, der: 6 }

/** RF-33 · Puntaje del período (días con kcal en rango y proteína ≥ 90 %), barras de kcal por día y promedio de macros. */
export function TuSemana({ userId, metas, hoy, fase }: { userId: string; metas: Metas; hoy: string; fase: DatosFase }) {
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [compartir, setCompartir] = useState(false)
  const fechas = useMemo(() => diasDelPeriodo(periodo, hoy), [periodo, hoy])
  const comidas = useRegistrosRango(userId, fechas[0]!, fechas.at(-1)!)
  const dias = useMemo(() => diasNutricion(comidas ?? [], fechas), [comidas, fechas])
  const r = useMemo(() => resumenPeriodo(dias, { kcal: metas.kcal, proteina: metas.proteinaG }, hoy), [dias, metas, hoy])
  const descripcion = describirResumen(r, periodo)

  const maxKcal = Math.max(metas.rango.max * 1.15, ...dias.map((d) => d.kcal))
  const y = (kcal: number) => M.arriba + (1 - kcal / maxKcal) * (ALTO - M.arriba - M.abajo)
  const paso = (ANCHO - M.izq - M.der) / dias.length
  const anchoBarra = Math.max(4, paso * 0.62)
  const enRango = (kcal: number) => kcal >= metas.rango.min && kcal <= metas.rango.max

  return (
    <Tarjeta className="lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{periodo === 'semana' ? 'Tu semana' : 'Tu mes'}</h2>
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-superficie-elevada p-1 sm:flex sm:w-auto" role="group" aria-label="Período del resumen">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={periodo === p.id}
              onClick={() => setPeriodo(p.id)}
              className={cn(
                'min-h-11 rounded-lg px-4 text-sm font-medium transition-colors',
                periodo === p.id ? 'bg-superficie text-texto shadow-tarjeta' : 'text-texto-secundario hover:text-texto',
              )}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </div>

      {!comidas ? (
        <p className="mt-4 text-sm text-texto-secundario">Cargando…</p>
      ) : !r.promedio ? (
        <EstadoVacio
          compacto
          className="mt-4"
          icono={CalendarCheck}
          titulo={periodo === 'semana' ? 'Tu semana está en blanco' : 'Tu mes está en blanco'}
          texto="Cuando anotes tus comidas verás aquí cuántos días cumpliste tus kcal y tu proteína, con tus promedios."
        />
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {[
              { titulo: 'Kcal en rango', valor: r.diasKcal },
              { titulo: 'Proteína ≥ 90 %', valor: r.diasProteina },
              { titulo: 'Ambas', valor: r.diasAmbos },
            ].map((p) => (
              <div key={p.titulo} className="rounded-xl bg-superficie-elevada p-3">
                <dt className="text-xs text-texto-secundario sm:text-sm">{p.titulo}</dt>
                <dd className="mt-1">
                  <span className="num text-3xl leading-none font-bold">{p.valor}</span>
                  <span className="text-sm text-texto-secundario"> de {r.diasTranscurridos} días</span>
                </dd>
              </div>
            ))}
          </dl>

          <figure className="mt-5">
            <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto max-h-72 w-full" role="img" aria-label={descripcion}>
              {/* Franja de tu rango de kcal */}
              <rect x={M.izq} y={y(metas.rango.max)} width={ANCHO - M.izq - M.der} height={y(metas.rango.min) - y(metas.rango.max)} className="fill-exito/15" />
              {[metas.rango.min, metas.rango.max].map((v) => (
                <text key={v} x={M.izq - 6} y={y(v) + 4} textAnchor="end" className="fill-texto-secundario text-[14px]">
                  {formatoNumero(v)}
                </text>
              ))}
              {dias.map((d, i) => {
                const cx = M.izq + paso * i + paso / 2
                const futuro = d.fecha > hoy
                return (
                  <g key={d.fecha}>
                    {d.registros > 0 &&
                      (enRango(d.kcal) ? (
                        <rect x={cx - anchoBarra / 2} y={y(d.kcal)} width={anchoBarra} height={y(0) - y(d.kcal)} rx={3} className="fill-exito" />
                      ) : (
                        // Fuera de rango: barra hueca (la diferencia no depende solo del color).
                        <rect
                          x={cx - anchoBarra / 2 + 1}
                          y={y(d.kcal) + 1}
                          width={anchoBarra - 2}
                          height={Math.max(0, y(0) - y(d.kcal) - 2)}
                          rx={3}
                          className="fill-none stroke-texto-secundario"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                        />
                      ))}
                    {(periodo === 'semana' || numeroDia(d.fecha) % 7 === 1) && (
                      <text x={cx} y={ALTO - 6} textAnchor="middle" className={cn('text-[14px]', futuro ? 'fill-texto-secundario/50' : 'fill-texto-secundario')}>
                        {periodo === 'semana' ? inicialDia(d.fecha) : numeroDia(d.fecha)}
                      </text>
                    )}
                  </g>
                )
              })}
              <line x1={M.izq} x2={ANCHO - M.der} y1={y(0)} y2={y(0)} className="stroke-borde" />
            </svg>
            <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-texto-secundario">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-exito" aria-hidden /> Barra llena: en tu rango
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm border-2 border-dashed border-texto-secundario" aria-hidden /> Barra hueca: fuera de rango
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-exito/25" aria-hidden /> Franja: {formatoNumero(metas.rango.min)}–{formatoNumero(metas.rango.max)} kcal
              </span>
            </figcaption>
          </figure>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Promedio diario de macros</h3>
            <ul className="mt-2 flex flex-col gap-3">
              {[
                { nombre: 'Proteína', valor: r.promedio.proteina, meta: metas.proteinaG, color: 'bg-proteina' },
                { nombre: 'Carbos', valor: r.promedio.carbos, meta: metas.carbosG, color: 'bg-carbos' },
                { nombre: 'Grasas', valor: r.promedio.grasas, meta: metas.grasasG, color: 'bg-grasas' },
              ].map((x) => (
                <li key={x.nombre}>
                  <p className="mb-1 flex justify-between text-sm">
                    <span>{x.nombre}</span>
                    <span>
                      <span className="num font-bold">{formatoNumero(x.valor)}</span>
                      <span className="text-texto-secundario"> / {formatoNumero(x.meta)} g</span>
                    </span>
                  </p>
                  <Barra
                    porcentaje={(x.valor / x.meta) * 100}
                    etiqueta={`${x.nombre} promedio`}
                    texto={`${formatoNumero(x.valor)} de ${formatoNumero(x.meta)} gramos`}
                    colorClase={x.color}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-texto-secundario">{descripcion}</p>
          </div>

          <Boton variante="secundario" ancho="completo" className="mt-5 sm:w-auto" onClick={() => setCompartir(true)}>
            <Share2 aria-hidden /> Compartir mi {periodo === 'semana' ? 'semana' : 'mes'}
          </Boton>
          <CompartirProgreso
            abierta={compartir}
            alCambiar={setCompartir}
            userId={userId}
            resumen={r}
            periodo={periodo}
            dias={dias}
            rango={metas.rango}
            metaKcal={metas.kcal}
            hoy={hoy}
            {...fase}
          />

          {/* Tabla solo para lectores de pantalla (el contenedor sr-only evita que ensanche la página). */}
          <div className="sr-only">
            <table>
              <caption>Kcal y proteína por día</caption>
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Kcal</th>
                  <th scope="col">Proteína (g)</th>
                </tr>
              </thead>
              <tbody>
                {dias
                  .filter((d) => d.fecha <= hoy)
                  .map((d) => (
                    <tr key={d.fecha}>
                      <th scope="row">{fechaCorta(d.fecha)}</th>
                      <td>{d.registros ? formatoNumero(d.kcal) : 'Sin registros'}</td>
                      <td>{d.registros ? formatoNumero(d.proteina) : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Tarjeta>
  )
}
