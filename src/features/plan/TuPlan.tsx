import { TriangleAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { usePesos } from '@/data/consultas'
import { ResumenPlan } from './ResumenPlan'
import { textoAviso, NOMBRE_FASE } from './textos'
import { usePlan } from './usePlan'

/** Pantalla final del cuestionario: muestra el plan con animación y explica cada número. */
export default function TuPlan() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const pesos = usePesos(userId)
  const { plan } = usePlan(perfil, pesos)
  const navegar = useNavigate()

  if (!perfil || pesos === undefined) return <PantallaCargando />
  if (!plan) return <PantallaCargando texto="Calculando tu plan…" />
  const aviso = textoAviso(plan.avisos, perfil.sexo)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header>
        <p className="text-texto-secundario">Listo, {perfil.nombre}. Esta es tu fase de {NOMBRE_FASE[perfil.objetivo!].toLowerCase()}.</p>
        <h1 className="mt-1 text-5xl">Tu plan</h1>
      </header>
      {aviso && (
        <div className="flex gap-3 rounded-2xl border border-alerta/50 bg-superficie p-4 text-sm" role="note">
          <TriangleAlert className="size-5 shrink-0 text-alerta" aria-hidden />
          <p>
            {aviso}{' '}
            <Link to="/ajustes/perfil" className="font-semibold text-texto-marca underline underline-offset-2">
              Cambiar velocidad
            </Link>
          </p>
        </div>
      )}
      <ResumenPlan plan={plan} />
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Boton ancho="completo" className="sm:w-auto sm:min-w-56" onClick={() => navegar('/', { replace: true })}>
          Empezar
        </Boton>
        <Boton variante="secundario" ancho="completo" className="sm:w-auto" onClick={() => navegar('/mi-plan?ajustar=1')}>
          Ajustar a mano
        </Boton>
      </div>
    </div>
  )
}
