import { Search, UtensilsCrossed } from 'lucide-react'
import { m } from 'motion/react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useSesion, useUsuario } from '@/app/useSesion'
import { EstadoVacio } from '@/components/EstadoVacio'
import { IconoKaibu } from '@/components/Logo'
import { Racha } from '@/components/Racha'
import { Boton } from '@/components/ui/button'
import { Entrada } from '@/components/ui/campo'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { usePesos, useRegistrosRango } from '@/data/consultas'
import type { RegistroComida } from '@/data/db'
import { sumarNutrientes } from '@/domain/calc/dia'
import { fechaLarga, hoyISO, sumarDias } from '@/domain/format/formato'
import { usePlan } from '@/features/plan/usePlan'
import { RegistrarPeso } from '@/features/peso/RegistrarPeso'
import { EditarRegistro } from './EditarRegistro'
import { estadosPorFecha, rachaActual, resumenPorComida } from './resumenDia'
import { TarjetaComida } from './TarjetaComida'
import { TarjetaKcal } from './TarjetaKcal'
import { TarjetaPeso } from './TarjetaPeso'
import { TiraSemana } from './TiraSemana'

const aparecer = {
  oculto: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
}

export default function Hoy() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const [params, setParams] = useSearchParams()
  const hoy = hoyISO()
  const fecha = params.get('fecha') && params.get('fecha')! <= hoy ? params.get('fecha')! : hoy
  const [pesoAbierto, setPesoAbierto] = useState(false)
  const [edicion, setEdicion] = useState<{ registro: RegistroComida | null; abierta: boolean }>({ registro: null, abierta: false })
  const [busqueda, setBusqueda] = useState('')

  // Un año hacia atrás alcanza para la racha y la semana.
  const registros = useRegistrosRango(userId, sumarDias(hoy, -366), hoy)
  const pesos = usePesos(userId)
  const { plan } = usePlan(perfil, pesos)

  const delDia = useMemo(() => (registros ?? []).filter((r) => r.fecha === fecha).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [registros, fecha])
  const estados = useMemo(() => (plan && registros ? estadosPorFecha(registros, plan.kcal) : {}), [registros, plan])
  const racha = useMemo(() => (plan && registros ? rachaActual(registros, plan.kcal, hoy) : 0), [registros, plan, hoy])

  if (!perfil || !registros || !pesos || !plan) return <PantallaCargando />

  const total = sumarNutrientes(delDia)
  const comidas = resumenPorComida(delDia, perfil.comidas)
  const metaPorComida = new Map(plan.comidas.map((c) => [c.id, c.kcal]))
  const elegirFecha = (f: string) => setParams(f === hoy ? {} : { fecha: f }, { replace: true })
  const buscar = (e: FormEvent) => {
    e.preventDefault()
    navegar(`/agregar?fecha=${fecha}${busqueda.trim() ? `&q=${encodeURIComponent(busqueda.trim())}` : ''}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconoKaibu className="size-9 lg:hidden" />
          <div>
            <p className="hidden text-sm text-texto-secundario first-letter:uppercase lg:block">{fechaLarga(fecha)}</p>
            <h1 className="text-4xl sm:text-5xl">{fecha === hoy ? 'Hoy' : fechaLarga(fecha).split(' ')[0]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Racha dias={racha} />
          <form onSubmit={buscar} className="hidden items-center gap-2 lg:flex" role="search">
            <label htmlFor="buscar-hoy" className="sr-only">
              Buscar un alimento para agregar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-secundario" aria-hidden />
              <Entrada id="buscar-hoy" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escribe: marraqueta, huevo, palta…" className="min-h-11 w-80 pl-9 text-sm" />
            </div>
            <Boton type="submit" tamano="sm">
              Agregar
            </Boton>
          </form>
        </div>
      </header>
      <p className="-mt-3 text-sm text-texto-secundario first-letter:uppercase lg:hidden">{fechaLarga(fecha)}</p>

      <TiraSemana fecha={fecha} hoy={hoy} estados={estados} alElegir={elegirFecha} />

      <div className="grid gap-4 lg:grid-cols-3">
        <m.div className="lg:col-span-2" variants={aparecer} initial="oculto" animate="visible" custom={0}>
          <TarjetaKcal plan={plan} total={total} />
        </m.div>
        <m.div variants={aparecer} initial="oculto" animate="visible" custom={1}>
          <TarjetaPeso pesos={pesos} fecha={fecha} pesoMeta={perfil.objetivo !== 'mantener' ? perfil.pesoMeta : null} alRegistrar={() => setPesoAbierto(true)} />
        </m.div>

        <m.div className="lg:col-span-3" variants={aparecer} initial="oculto" animate="visible" custom={2}>
          <Tarjeta>
            <h2 className="font-semibold">Comidas</h2>
            {delDia.length === 0 && (
              <EstadoVacio
                compacto
                className="mt-3"
                icono={UtensilsCrossed}
                titulo={fecha === hoy ? 'Tu día está en blanco' : 'Sin registros este día'}
                texto="Toca + en una comida para registrar lo primero. Después tendrás tus recientes y favoritos a un toque."
              />
            )}
            <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {comidas.map((c) => (
                <TarjetaComida key={c.id} comida={c} fecha={fecha} metaKcal={metaPorComida.get(c.id)} alEditar={(r) => setEdicion({ registro: r, abierta: true })} />
              ))}
            </ul>
          </Tarjeta>
        </m.div>
      </div>

      <RegistrarPeso abierta={pesoAbierto} alCambiar={setPesoAbierto} userId={userId} existente={pesos.find((p) => p.fecha === fecha)} fechaInicial={fecha} />
      <EditarRegistro registro={edicion.registro} abierta={edicion.abierta} comidas={perfil.comidas} alCerrar={() => setEdicion((e) => ({ ...e, abierta: false }))} />
    </div>
  )
}
