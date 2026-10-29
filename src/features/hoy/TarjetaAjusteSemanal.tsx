import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Evento, Perfil, Peso } from '@/data/db'
import { sugerenciaSemanal } from '@/domain/calc/ajustes'
import { velocidadKgSemana } from '@/domain/calc/energia'
import { cambiosSemanales } from '@/domain/calc/peso'
import { claveRevision, debeMostrarAjuste } from '@/domain/calc/semana'
import { formatoNumero, sumarDias } from '@/domain/format/formato'
import { deshacerEvento, registrarEvento } from '@/features/plan/eventos'

interface Props {
  userId: string
  perfil: Perfil
  pesos: Peso[]
  eventos: Evento[]
  pesoKg: number
  kcalActual: number
  hoy: string
}

/** RF-10 · Ajuste semanal: Kaibu sugiere, el usuario decide. Rige desde mañana. */
export function TarjetaAjusteSemanal({ userId, perfil, pesos, eventos, pesoKg, kcalActual, hoy }: Props) {
  if (!perfil.objetivo || !perfil.velocidad || perfil.kcalManual !== null) return null
  const registros = pesos.map((p) => ({ fecha: p.fecha, kg: p.kg }))
  const sugerencia = sugerenciaSemanal({
    objetivo: perfil.objetivo,
    ritmoPlaneado: velocidadKgSemana(perfil.objetivo, perfil.velocidad),
    cambiosSemanales: cambiosSemanales(registros, hoy, 2),
    pesoKg,
  })
  if (!sugerencia || !debeMostrarAjuste({ hoy, sugerencia, eventos })) return null

  const clave = claveRevision(hoy)
  const delta = sugerencia.deltaKcal
  const nueva = kcalActual + delta
  const signo = delta > 0 ? '+' : '−'

  const responder = async (aceptar: boolean) => {
    const evento = await registrarEvento(userId, 'ajuste_semanal', clave, aceptar ? String(delta) : 'rechazado', aceptar ? sumarDias(hoy, 1) : hoy)
    toast(aceptar ? `Desde mañana tu meta será ${formatoNumero(nueva)} kcal` : 'Mantienes tu meta actual', {
      description: aceptar ? 'Lo verás explicado en Mi plan.' : 'La próxima semana volvemos a revisar tu avance.',
      action: { label: 'Deshacer', onClick: () => void deshacerEvento(evento) },
    })
  }

  return (
    <Tarjeta className="border-marca/40" aria-labelledby="ajuste-semanal-titulo">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-superficie-elevada" aria-hidden>
          <CalendarCheck className="size-6 text-texto-marca" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="rotulo">Ajuste semanal</p>
          <h2 id="ajuste-semanal-titulo" className="mt-1 text-xl font-semibold">
            Te sugerimos <span className="num text-texto-marca">{signo}{formatoNumero(Math.abs(delta))} kcal</span> al día
          </h2>
          <p className="mt-1 text-sm text-texto-secundario">
            {sugerencia.motivo} Lo calculamos con tu promedio de 7 días, no con pesos sueltos. Tu meta pasaría de{' '}
            <span className="num font-semibold text-texto">{formatoNumero(kcalActual)}</span> a{' '}
            <span className="num font-semibold text-texto">{formatoNumero(nueva)} kcal</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Boton tamano="sm" onClick={() => void responder(true)}>
              Aceptar desde mañana
            </Boton>
            <Boton tamano="sm" variante="secundario" onClick={() => void responder(false)}>
              Ahora no
            </Boton>
          </div>
        </div>
      </div>
    </Tarjeta>
  )
}
