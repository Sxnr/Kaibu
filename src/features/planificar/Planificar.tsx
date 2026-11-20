// Planificar: preparaciones de meal prep, repartirlas en la semana, repetir semanas y lista de compras.
import { CalendarRange, ChefHat, Copy, ListChecks, Pencil, Plus, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Opciones } from '@/components/ui/opciones'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useMisAlimentos, useRecetas, useRegistrosRango } from '@/data/consultas'
import type { Receta, RegistroComida } from '@/data/db'
import { borrar, guardarVarios } from '@/data/escritura'
import { formatoNumero, hoyISO, inicioSemana, sumarDias } from '@/domain/format/formato'
import { fechasRepetidas } from '@/domain/plan/repartir'
import { copiarRegistros } from '@/features/agregar/registrar'
import { vibrar } from '@/lib/utils'
import { RepartirReceta } from './RepartirReceta'

type Semana = 'esta' | 'proxima'

export default function Planificar() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const hoy = hoyISO()
  const recetas = useRecetas(userId)
  const misAlimentos = useMisAlimentos(userId)
  const lunes = inicioSemana(hoy)
  const registros = useRegistrosRango(userId, lunes, sumarDias(lunes, 13))
  const [repartir, setRepartir] = useState<{ receta: Receta | null; abierta: boolean }>({ receta: null, abierta: false })

  if (!perfil || !recetas || !misAlimentos || !registros) return <PantallaCargando />
  const porId = new Map(misAlimentos.map((m) => [m.id, m]))

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Planificar" antetitulo="Meal prep, semanas y compras" ayuda="planificar" />

      <Tarjeta className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <ChefHat className="size-5 text-texto-marca" aria-hidden /> Tus preparaciones
          </h2>
          {recetas.length > 0 && (
            <Boton asChild tamano="sm">
              <Link to="/planificar/receta/nueva">
                <Plus aria-hidden /> Nueva
              </Link>
            </Boton>
          )}
        </div>
        {recetas.length === 0 ? (
          <EstadoVacio
            compacto
            icono={ChefHat}
            titulo="Aún no tienes preparaciones"
            texto="Cocina una vez para varios días: anota los ingredientes, divide en porciones y repártelas en tu semana."
            accion={
              <Boton asChild>
                <Link to="/planificar/receta/nueva">
                  <Plus aria-hidden /> Nueva preparación
                </Link>
              </Boton>
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recetas.map((r) => {
              const alimento = porId.get(r.alimentoId)
              const kcal = alimento && alimento.porcionG ? Math.round((alimento.kcal * alimento.porcionG) / 100) : null
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-borde p-4">
                  <div>
                    <p className="font-semibold">{r.nombre}</p>
                    <p className="text-sm text-texto-secundario">
                      {formatoNumero(r.porciones, r.porciones % 1 ? 1 : 0)} porciones
                      {kcal !== null && ` · ${formatoNumero(kcal)} kcal cada una`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Boton tamano="sm" onClick={() => setRepartir({ receta: r, abierta: true })} disabled={!alimento}>
                      <CalendarRange aria-hidden /> Repartir
                    </Boton>
                    <Boton asChild variante="contorno" tamano="sm">
                      <Link to={`/planificar/receta/${r.id}`} aria-label={`Editar ${r.nombre}`}>
                        <Pencil aria-hidden /> Editar
                      </Link>
                    </Boton>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <RepetirSemana hoy={hoy} registros={registros} />

      <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ListChecks className="size-6 shrink-0 text-texto-marca" aria-hidden />
        <div className="flex-1">
          <h2 className="font-semibold">Lista de compras</h2>
          <p className="text-sm text-texto-secundario">Lo que necesitas comprar según lo que planificaste.</p>
        </div>
        <Boton asChild variante="contorno" tamano="sm">
          <Link to="/planificar/compras">Ver lista</Link>
        </Boton>
      </Tarjeta>

      <RepartirReceta
        abierta={repartir.abierta}
        alCambiar={(a) => setRepartir((x) => ({ ...x, abierta: a }))}
        receta={repartir.receta}
        alimento={repartir.receta ? porId.get(repartir.receta.alimentoId) : undefined}
        comidas={perfil.comidas}
        userId={userId}
        hoy={hoy}
      />
    </div>
  )
}

/** Copia lo anotado o planificado de una semana a las siguientes (plan mensual). */
function RepetirSemana({ hoy, registros }: { hoy: string; registros: RegistroComida[] }) {
  const [semana, setSemana] = useState<Semana>('esta')
  const [veces, setVeces] = useState<'1' | '2' | '3' | '4'>('3')
  const lunes = inicioSemana(semana === 'esta' ? hoy : sumarDias(hoy, 7))
  const deLaSemana = useMemo(() => registros.filter((r) => r.fecha >= lunes && r.fecha <= sumarDias(lunes, 6)), [registros, lunes])

  const repetir = async () => {
    const nuevos = deLaSemana.flatMap((r) => fechasRepetidas(r.fecha, Number(veces), hoy).flatMap((f) => copiarRegistros([r], f)))
    if (nuevos.length === 0) return
    await guardarVarios('registros', nuevos)
    vibrar()
    toast(`Repetiste ${deLaSemana.length} ${deLaSemana.length === 1 ? 'comida' : 'comidas'} en ${veces} ${veces === '1' ? 'semana' : 'semanas'} más`, {
      action: { label: 'Deshacer', onClick: () => void Promise.all(nuevos.map((r) => borrar('registros', r))) },
    })
  }

  return (
    <Tarjeta className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Repeat className="size-5 text-texto-marca" aria-hidden /> Repetir una semana
      </h2>
      <Opciones
        etiqueta="Semana que se repite"
        columnas={2}
        valor={semana}
        alCambiar={setSemana}
        opciones={[
          { valor: 'esta', titulo: 'Esta semana' },
          { valor: 'proxima', titulo: 'La próxima' },
        ]}
      />
      <div>
        <p className="mb-2 text-sm font-medium">¿Cuántas semanas más?</p>
        <Opciones
          etiqueta="Cuántas semanas más"
          columnas={4}
          valor={veces}
          alCambiar={setVeces}
          opciones={(['1', '2', '3', '4'] as const).map((v) => ({ valor: v, titulo: v }))}
        />
      </div>
      <p className="text-sm text-texto-secundario">
        {deLaSemana.length === 0
          ? 'Esa semana todavía no tiene comidas. Anota o reparte algo primero.'
          : `Se copian ${deLaSemana.length} ${deLaSemana.length === 1 ? 'comida' : 'comidas'} al mismo día de cada semana.`}
      </p>
      <Boton onClick={() => void repetir()} disabled={deLaSemana.length === 0}>
        <Copy aria-hidden /> Repetir semana
      </Boton>
    </Tarjeta>
  )
}
