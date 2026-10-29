import { ChartLine, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Barra } from '@/components/Barra'
import { Encabezado } from '@/components/Encabezado'
import { EstadoVacio } from '@/components/EstadoVacio'
import { NumeroAnimado } from '@/components/NumeroAnimado'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useEventos, usePesos } from '@/data/consultas'
import type { Peso } from '@/data/db'
import { metaAlcanzada } from '@/domain/calc/ajustes'
import { velocidadKgSemana } from '@/domain/calc/energia'
import { avanceFase, promedioMovil7, proyeccionLlegada, ritmoReal, semanasDeDatos } from '@/domain/calc/peso'
import { fechaCompleta, fechaLarga, formatoNumero, hoyISO } from '@/domain/format/formato'
import { RegistrarPeso } from '@/features/peso/RegistrarPeso'
import { NOMBRE_FASE } from '@/features/plan/textos'
import { planDesdePerfil, usePlan } from '@/features/plan/usePlan'
import { CambioFase } from './CambioFase'
import { GraficoPeso } from './GraficoPeso'

const kgSemanaTexto = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatoNumero(Math.abs(v), 2)} kg/sem`

export default function Progreso() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const pesos = usePesos(userId)
  const eventos = useEventos(userId)
  const { plan } = usePlan(perfil, pesos, eventos)
  const [hoja, setHoja] = useState<{ abierta: boolean; existente: Peso | null }>({ abierta: false, existente: null })
  const hoy = hoyISO()

  const serie = useMemo(() => promedioMovil7((pesos ?? []).map((p) => ({ fecha: p.fecha, kg: p.kg }))), [pesos])
  if (!perfil || !pesos || !eventos) return <PantallaCargando />

  const registros = pesos.map((p) => ({ fecha: p.fecha, kg: p.kg }))
  const actual = serie.at(-1)?.promedio ?? null
  const objetivo = perfil.objetivo!
  const inicio = perfil.pesoInicial ?? actual
  const meta = perfil.pesoMeta
  const planeado = velocidadKgSemana(objetivo, perfil.velocidad ?? 'recomendada')
  const ritmo = ritmoReal(registros, hoy)
  const semanas = semanasDeDatos(registros)
  const pct = inicio && actual && meta && objetivo !== 'mantener' ? avanceFase(inicio, actual, meta) : null
  const proyeccion =
    actual && meta ? proyeccionLlegada({ pesoActual: actual, pesoMeta: meta, ritmoReal: ritmo, ritmoPlaneado: planeado, objetivo, semanasDatos: semanas, hoy }) : null
  const llego = actual && meta ? metaAlcanzada(objetivo, actual, meta) : false
  const abrirNuevo = () => setHoja({ abierta: true, existente: null })

  return (
    <div className="flex flex-col gap-5">
      <Encabezado
        titulo="Progreso"
        acciones={
          <Boton tamano="sm" onClick={abrirNuevo}>
            <Plus aria-hidden /> Registrar peso
          </Boton>
        }
      />

      {pesos.length === 0 ? (
        <EstadoVacio
          icono={ChartLine}
          titulo="Tu progreso parte aquí"
          texto="Registra tu peso en ayunas algunas veces por semana. Con el promedio de 7 días verás tu avance real, sin el ruido del día a día."
          accion={<Boton onClick={abrirNuevo}>Registrar mi peso</Boton>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {llego && plan && actual && objetivo !== 'mantener' && (
            <CambioFase
              userId={userId}
              perfil={perfil}
              eventos={eventos}
              kcalActual={plan.kcal}
              pesoActual={actual}
              kcalDestino={(destino) => planDesdePerfil({ ...perfil, objetivo: destino, velocidad: destino === 'ganar' ? 'lenta' : perfil.velocidad, kcalManual: null }, actual)?.kcal ?? null}
              hoy={hoy}
            />
          )}
          <Tarjeta className="lg:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="rotulo">Fase · {NOMBRE_FASE[objetivo]}</p>
              {proyeccion && !llego && (
                <p className="text-sm text-texto-secundario">
                  {proyeccion.semanas} {proyeccion.semanas === 1 ? 'semana restante' : 'semanas restantes'}
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="flex items-baseline gap-1">
                  <NumeroAnimado valor={actual ?? 0} decimales={1} className="num text-6xl leading-none font-bold" />
                  <span className="text-texto-secundario">kg</span>
                </p>
                <p className="text-sm text-texto-secundario">promedio 7 días · inicio {formatoNumero(inicio ?? 0, 1)} kg</p>
              </div>
              {meta && objetivo !== 'mantener' && (
                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="num text-6xl leading-none font-bold text-numero-marca">{formatoNumero(meta, 1)}</span>
                    <span className="text-texto-secundario">kg</span>
                  </p>
                  <p className="text-sm text-texto-secundario">meta</p>
                </div>
              )}
            </div>
            {pct !== null && (
              <>
                <Barra porcentaje={pct} etiqueta="Avance hacia la meta" texto={`${formatoNumero(pct, 0)} % logrado`} alto="md" className="mt-5" />
                <p className="mt-2 text-sm">
                  <span className="num text-lg font-bold">{formatoNumero(pct, 0)} %</span> logrado
                  {llego && <span className="font-semibold text-exito"> · ¡Llegaste a tu meta de fase!</span>}
                  {proyeccion && !llego && (
                    <span className="text-texto-secundario">
                      {' '}
                      · llegada estimada: {fechaCompleta(proyeccion.fecha)} ({proyeccion.basadoEn === 'real' ? 'según tu ritmo real' : 'según el ritmo planeado'})
                    </span>
                  )}
                </p>
              </>
            )}
          </Tarjeta>

          <Tarjeta>
            <h2 className="font-semibold">Ritmo</h2>
            <dl className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-texto-secundario">Real (últimas 2 semanas)</dt>
                <dd className="num text-xl font-bold">{ritmo === null ? '—' : kgSemanaTexto(ritmo)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-texto-secundario">Planeado</dt>
                <dd className="num text-xl font-bold">
                  {objetivo === 'mantener' ? '0 kg/sem' : kgSemanaTexto(objetivo === 'perder' ? -planeado : planeado)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 flex gap-2 text-sm text-texto-secundario">
              {objetivo === 'ganar' ? <TrendingUp className="size-4 shrink-0" aria-hidden /> : <TrendingDown className="size-4 shrink-0" aria-hidden />}
              {ritmo === null
                ? 'Necesitamos al menos un peso en cada una de las últimas 2 semanas para calcular tu ritmo real.'
                : 'El ritmo real compara el promedio de esta semana con el de la anterior.'}
            </p>
          </Tarjeta>

          <GraficoPeso registros={registros} hoy={hoy} />

          <Tarjeta className="lg:col-span-3">
            <h2 className="font-semibold">Registros de peso</h2>
            <ul className="mt-2 divide-y divide-borde">
              {[...serie].reverse().map((p) => (
                <li key={p.fecha}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-1 text-left hover:bg-superficie-elevada"
                    onClick={() => setHoja({ abierta: true, existente: pesos.find((x) => x.fecha === p.fecha) ?? null })}
                  >
                    <span className="flex-1 text-sm">
                      <span className="sr-only">Editar peso del </span>
                      {fechaLarga(p.fecha)}
                    </span>
                    <span className="num text-lg font-bold">{formatoNumero(p.kg, 1)} kg</span>
                    <span className="num w-28 text-right text-sm text-texto-secundario">prom. {formatoNumero(p.promedio, 1)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      )}

      <RegistrarPeso abierta={hoja.abierta} alCambiar={(v) => setHoja((h) => ({ ...h, abierta: v }))} userId={userId} existente={hoja.existente} />
    </div>
  )
}
