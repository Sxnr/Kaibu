import { Ban, Bug, CheckCircle2, Clock, Lightbulb, Map, MessagesSquare, Send, Wrench, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSesion } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useClavesPendientes, useReportes } from '@/data/consultas'
import { textoEstado, type EstadoReporte, type TipoReporte } from '@/domain/comunidad/reportes'
import { fechaCorta } from '@/domain/format/formato'
import { marcarVisitada } from '@/domain/comunidad/descubrir'
import { actualizarDescubrir } from './descubrirEstado'
import { INVITACION_DISCORD } from './discord'
import { FormularioReporte } from './FormularioReporte'
import { VinculoDiscord } from './VinculoDiscord'

const ICONO_ESTADO: Record<EstadoReporte, LucideIcon> = {
  enviado: Clock,
  publicado: CheckCircle2,
  en_sprint: Wrench,
  resuelto: CheckCircle2,
  planificada: Map,
  aprobada: CheckCircle2,
  fuera_alcance: Ban,
}

/** Comunidad: Discord de Kaibu, vincular la cuenta y enviar reportes o sugerencias. */
export default function Comunidad() {
  const { userId, modoLocal, enLinea } = useSesion()
  const reportes = useReportes(userId)
  const pendientes = useClavesPendientes('reportes')
  const [formulario, setFormulario] = useState<TipoReporte | null>(null)
  // Ya conoce la Comunidad: se apagan el punto "Nuevo" y la invitación de Hoy.
  useEffect(() => actualizarDescubrir(marcarVisitada), [])
  if (!userId || !reportes || !pendientes) return <PantallaCargando />

  const motivoVinculo = modoLocal
    ? 'Para vincular tu Discord necesitas una cuenta de Kaibu. Ahora estás usando la app sin cuenta, solo en este dispositivo.'
    : 'Necesitas conexión a internet para vincular tu Discord.'

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Comunidad" antetitulo="El Discord de Kaibu" />

      {INVITACION_DISCORD && (
        <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <MessagesSquare className="size-5 text-texto-secundario" aria-hidden /> Únete a la comunidad
            </h2>
            <p className="mt-1 text-sm text-texto-secundario">Comparte tu semana, pregunta, propone ideas y conoce lo que viene antes que nadie.</p>
          </div>
          <Boton asChild>
            <a href={INVITACION_DISCORD} target="_blank" rel="noreferrer">
              Entrar al Discord
            </a>
          </Boton>
        </Tarjeta>
      )}

      <VinculoDiscord disponible={!modoLocal && enLinea} motivo={motivoVinculo} />

      <Tarjeta>
        <h2 className="font-semibold">Ayúdanos a mejorar Kaibu</h2>
        <p className="mt-1 text-sm text-texto-secundario">Llega directo al Discord de Kaibu. Si no tienes conexión, se envía cuando vuelva.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Boton variante="secundario" onClick={() => setFormulario('bug')}>
            <Bug aria-hidden /> Reportar un problema
          </Boton>
          <Boton variante="secundario" onClick={() => setFormulario('sugerencia')}>
            <Lightbulb aria-hidden /> Enviar una sugerencia
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold">Tus envíos</h2>
        {reportes.length === 0 ? (
          <EstadoVacio
            compacto
            className="mt-3"
            icono={Send}
            titulo="Aún no envías nada"
            texto="Cuando reportes un problema o propongas una idea, aquí verás si ya se publicó, si está en arreglo o si quedó resuelto."
          />
        ) : (
          <ul className="mt-3 divide-y divide-borde">
            {reportes.map((r) => {
              const Icono = ICONO_ESTADO[r.estado] ?? Clock
              return (
                <li key={r.id} className="flex items-start gap-3 py-3">
                  {r.tipo === 'bug' ? (
                    <Bug className="mt-0.5 size-5 shrink-0 text-texto-secundario" aria-label="Problema" />
                  ) : (
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-texto-secundario" aria-label="Sugerencia" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.titulo ?? r.descripcion}</p>
                    <p className="text-sm text-texto-secundario">{fechaCorta(r.createdAt.slice(0, 10))}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-superficie-elevada px-2.5 py-1 text-xs font-medium">
                    <Icono className="size-3.5" aria-hidden />
                    {textoEstado(r.estado, pendientes.has(r.id))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <FormularioReporte tipo={formulario} alCerrar={() => setFormulario(null)} userId={userId} puedeEnviar={!modoLocal} reportes={reportes} />
    </div>
  )
}
