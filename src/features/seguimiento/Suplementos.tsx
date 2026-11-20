// Suplementos (RF-26): dosis y horario, marcarlos como tomados y sumar sus kcal.
import { Clock, Pill, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Casilla } from '@/components/ui/checkbox'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useSuplementos, useTomasDia } from '@/data/consultas'
import type { Suplemento } from '@/data/db'
import { formatoNumero, hoyISO } from '@/domain/format/formato'
import { EditarSuplemento } from './EditarSuplemento'
import { alternarToma } from './tomas'

function detalleSuplemento(s: Suplemento): string {
  return [s.dosis, s.hora, s.kcal > 0 ? `${formatoNumero(s.kcal)} kcal` : null].filter(Boolean).join(' · ')
}

export default function Suplementos() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const hoy = hoyISO()
  const suplementos = useSuplementos(userId)
  const tomas = useTomasDia(userId, hoy)
  const [edicion, setEdicion] = useState<{ suplemento: Suplemento | null; abierta: boolean }>({ suplemento: null, abierta: false })
  if (!suplementos || !tomas || !perfil) return <PantallaCargando />
  const activos = suplementos.filter((s) => s.activo)
  const inactivos = suplementos.filter((s) => !s.activo)
  const comidas = perfil.comidas.map((c) => c.id)
  const nuevo = () => setEdicion({ suplemento: null, abierta: true })

  return (
    <div className="flex flex-col gap-5">
      <Encabezado
        titulo="Suplementos"
        antetitulo="Whey, creatina, vitaminas…"
        ayuda="suplementos"
        acciones={
          suplementos.length > 0 && (
            <Boton tamano="sm" onClick={nuevo}>
              <Plus aria-hidden /> Agregar
            </Boton>
          )
        }
      />

      {suplementos.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Pill}
            titulo="Aún no tienes suplementos"
            texto="Agrega lo que tomas con su dosis y hora. Cada día lo marcas con un toque y, si tiene calorías, se suman solas."
            accion={
              <Boton onClick={nuevo}>
                <Plus aria-hidden /> Agregar suplemento
              </Boton>
            }
          />
        </Tarjeta>
      ) : (
        <Tarjeta className="flex flex-col gap-1">
          <h2 className="mb-2 font-semibold">Hoy</h2>
          {activos.length === 0 && <p className="text-sm text-texto-secundario">Todos tus suplementos están apagados.</p>}
          <ul className="flex flex-col">
            {activos.map((s) => {
              const id = `toma-${s.id}`
              const tomada = tomas.get(s.id)
              return (
                <li key={s.id} className="flex min-h-14 items-center gap-3 border-b border-borde last:border-b-0">
                  <Casilla id={id} checked={!!tomada} onCheckedChange={() => void alternarToma(userId, s, hoy, comidas, tomada)} />
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer py-2">
                    <span className="block font-medium">{s.nombre}</span>
                    <span className="block text-sm text-texto-secundario">
                      {tomada ? 'Tomado' : 'Pendiente'}
                      {detalleSuplemento(s) && ` · ${detalleSuplemento(s)}`}
                    </span>
                  </label>
                  <Boton variante="fantasma" tamano="sm" onClick={() => setEdicion({ suplemento: s, abierta: true })} aria-label={`Editar ${s.nombre}`}>
                    Editar
                  </Boton>
                </li>
              )
            })}
          </ul>
        </Tarjeta>
      )}

      {inactivos.length > 0 && (
        <Tarjeta>
          <h2 className="mb-2 font-semibold">Apagados</h2>
          <ul className="flex flex-col">
            {inactivos.map((s) => (
              <li key={s.id} className="flex min-h-12 items-center gap-3">
                <Clock className="size-4 text-texto-secundario" aria-hidden />
                <span className="flex-1 text-texto-secundario">{s.nombre}</span>
                <Boton variante="fantasma" tamano="sm" onClick={() => setEdicion({ suplemento: s, abierta: true })} aria-label={`Editar ${s.nombre}`}>
                  Editar
                </Boton>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <EditarSuplemento userId={userId} abierta={edicion.abierta} suplemento={edicion.suplemento} alCambiar={(a) => setEdicion((e) => ({ ...e, abierta: a }))} />
    </div>
  )
}
