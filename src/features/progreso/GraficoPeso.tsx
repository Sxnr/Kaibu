import { useMemo, useState } from 'react'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { RegistroPeso } from '@/domain/calc/types'
import { describirGrafico, RANGOS, serieGrafico, type RangoGrafico } from '@/domain/calc/grafico'
import { diferenciaDias, fechaCorta, fechaLarga, formatoNumero } from '@/domain/format/formato'
import { cn } from '@/lib/utils'

const ANCHO = 640
const ALTO = 240
const M = { arriba: 12, abajo: 28, izq: 44, der: 12 }

/** RF-32 · Peso diario (puntos) y promedio de 7 días (línea principal), con rangos y descripción accesible. */
export function GraficoPeso({ registros, hoy }: { registros: RegistroPeso[]; hoy: string }) {
  const [rango, setRango] = useState<RangoGrafico>('1m')
  const s = useMemo(() => serieGrafico(registros, rango, hoy), [registros, rango, hoy])
  const descripcion = describirGrafico(s)

  const dias = Math.max(1, diferenciaDias(s.desde, s.hasta))
  const x = (fecha: string) => M.izq + (diferenciaDias(s.desde, fecha) / dias) * (ANCHO - M.izq - M.der)
  const y = (kg: number) => M.arriba + ((s.maxKg - kg) / (s.maxKg - s.minKg || 1)) * (ALTO - M.arriba - M.abajo)
  const linea = s.puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.fecha).toFixed(1)} ${y(p.promedio).toFixed(1)}`).join(' ')

  return (
    <Tarjeta className="lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Tu peso</h2>
        <div className="grid w-full grid-cols-4 gap-1 rounded-xl bg-superficie-elevada p-1 sm:flex sm:w-auto" role="group" aria-label="Rango del gráfico">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={rango === r.id}
              onClick={() => setRango(r.id)}
              className={cn(
                'min-h-11 rounded-lg px-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-3',
                rango === r.id ? 'bg-superficie text-texto shadow-tarjeta' : 'text-texto-secundario hover:text-texto',
              )}
            >
              {r.texto}
            </button>
          ))}
        </div>
      </div>

      <figure className="mt-4">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full" role="img" aria-label={descripcion}>
          {s.marcas.map((v) => (
            <g key={v}>
              <line x1={M.izq} x2={ANCHO - M.der} y1={y(v)} y2={y(v)} className="stroke-borde" strokeWidth={1} />
              <text x={M.izq - 8} y={y(v) + 4} textAnchor="end" className="fill-texto-secundario text-[11px]">
                {formatoNumero(v, v % 1 ? 1 : 0)}
              </text>
            </g>
          ))}
          {s.puntos.length > 0 && (
            <>
              <text x={M.izq} y={ALTO - 8} className="fill-texto-secundario text-[11px]">
                {fechaCorta(s.desde)}
              </text>
              <text x={ANCHO - M.der} y={ALTO - 8} textAnchor="end" className="fill-texto-secundario text-[11px]">
                {fechaCorta(s.hasta)}
              </text>
            </>
          )}
          {s.puntos.map((p) => (
            <circle key={p.fecha} cx={x(p.fecha)} cy={y(p.kg)} r={3.5} className="fill-texto-secundario" opacity={0.55} />
          ))}
          {s.puntos.length > 1 && <path d={linea} fill="none" className="stroke-texto-marca" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-secundario">
          <span className="flex items-center gap-2">
            <span className="h-1 w-5 rounded-full bg-texto-marca" aria-hidden /> Promedio de 7 días (línea)
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-texto-secundario opacity-55" aria-hidden /> Peso de cada día (puntos)
          </span>
        </figcaption>
      </figure>

      {/* Tabla solo para lectores de pantalla (el contenedor sr-only evita que ensanche la página). */}
      {s.puntos.length > 0 && (
        <div className="sr-only">
          <table>
            <caption>Registros de peso del gráfico</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Peso</th>
                <th scope="col">Promedio de 7 días</th>
              </tr>
            </thead>
            <tbody>
              {s.puntos.map((p) => (
                <tr key={p.fecha}>
                  <td>{fechaLarga(p.fecha)}</td>
                  <td>{formatoNumero(p.kg, 1)} kg</td>
                  <td>{formatoNumero(p.promedio, 1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Tarjeta>
  )
}
