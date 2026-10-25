import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { usePesos } from '@/data/consultas'
import { guardar } from '@/data/escritura'
import { repartoInicial } from '@/domain/calc/macros'
import { fechaCompleta, formatoNumero } from '@/domain/format/formato'
import { AjustarPlan } from './AjustarPlan'
import { ResumenPlan } from './ResumenPlan'
import { NOMBRE_FASE, NOMBRE_NIVEL, textoAviso } from './textos'
import { usePlan } from './usePlan'

export default function MiPlan() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const pesos = usePesos(userId)
  const { plan, pesoKg } = usePlan(perfil, pesos)
  const [params, setParams] = useSearchParams()
  const [ajustar, setAjustar] = useState(params.get('ajustar') === '1')

  if (!perfil || pesos === undefined || !plan || !pesoKg) return <PantallaCargando />
  const manual = perfil.kcalManual !== null || perfil.proteinaGKg !== null || perfil.aguaMetaMl !== null
  const aviso = textoAviso(plan.avisos, perfil.sexo)

  const recalcular = async () => {
    const anterior = perfil
    await guardar('perfiles', {
      ...perfil,
      kcalManual: null,
      proteinaGKg: null,
      aguaMetaMl: null,
      comidas: repartoInicial(perfil.numComidas ?? 4, perfil.colaciones),
    })
    toast('Plan recalculado con tus datos', { action: { label: 'Deshacer', onClick: () => void guardar('perfiles', anterior) } })
  }

  const cambiarAjuste = (v: boolean) => {
    setAjustar(v)
    if (!v && params.has('ajustar')) setParams({}, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Mi plan"
        antetitulo={manual ? 'Con ajustes hechos por ti' : 'Calculado con tus datos'}
        acciones={
          <>
            <Boton variante="secundario" tamano="sm" onClick={recalcular}>
              <RotateCcw aria-hidden /> Recalcular
            </Boton>
            <Boton tamano="sm" onClick={() => cambiarAjuste(true)}>
              <SlidersHorizontal aria-hidden /> Ajustar
            </Boton>
          </>
        }
      />

      <Tarjeta>
        <p className="rotulo">Fase actual</p>
        <p className="mt-1 font-display text-3xl font-bold uppercase">{NOMBRE_FASE[perfil.objetivo!]}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-texto-secundario">Desde</dt>
            <dd className="font-medium">{perfil.faseInicio ? fechaCompleta(perfil.faseInicio) : '—'}</dd>
          </div>
          <div>
            <dt className="text-texto-secundario">Peso de referencia</dt>
            <dd className="num text-lg font-bold">{formatoNumero(pesoKg, 1)} kg</dd>
          </div>
          <div>
            <dt className="text-texto-secundario">Meta</dt>
            <dd className="num text-lg font-bold">{perfil.pesoMeta ? `${formatoNumero(perfil.pesoMeta, 1)} kg` : '—'}</dd>
          </div>
          <div>
            <dt className="text-texto-secundario">Actividad</dt>
            <dd className="font-medium">
              {NOMBRE_NIVEL[plan.nivel]} (× {String(plan.factor).replace('.', ',')})
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-texto-secundario">
          El peso de referencia es tu promedio de los últimos 7 días: el plan se recalcula solo cuando cambia.{' '}
          <Link to="/ajustes/perfil" className="font-semibold text-texto-marca underline underline-offset-2">
            Editar mis datos
          </Link>
        </p>
      </Tarjeta>

      {aviso && (
        <p className="rounded-2xl border border-alerta/50 bg-superficie p-4 text-sm" role="note">
          {aviso}
        </p>
      )}

      <ResumenPlan plan={plan} />
      <AjustarPlan abierta={ajustar} alCambiar={cambiarAjuste} perfil={perfil} plan={plan} />
    </div>
  )
}
