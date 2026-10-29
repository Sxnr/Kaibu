import { CircleCheck, Flame, Flag, MoonStar, Trophy, type LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Evento } from '@/data/db'
import { logrosAlTerminar, type Logro, type TipoLogro } from '@/domain/calc/celebraciones'
import { formatoNumero } from '@/domain/format/formato'
import { clavesDe, deshacerEvento, registrarEvento } from '@/features/plan/eventos'
import { vibrar } from '@/lib/utils'

interface Props {
  userId: string
  hoy: string
  eventos: Evento[]
  kcal: number
  rango: { min: number; max: number }
  cumplido: boolean
  /** Racha contando hoy (si hoy está cumplido). */
  racha: number
  kgAvanzados: number
  metaAlcanzada: boolean
  faseInicio: string | null
}

const LOGRO: Record<TipoLogro, { icono: LucideIcon; titulo: (l: Logro) => string; texto: string }> = {
  meta: { icono: Trophy, titulo: () => '¡Llegaste a tu meta de fase!', texto: 'En Progreso puedes elegir tu próxima fase.' },
  kg: { icono: Flag, titulo: (l) => `${l.cantidad} ${l.cantidad === 1 ? 'kilo' : 'kilos'} de avance`, texto: 'Según tu promedio de 7 días, no un peso suelto.' },
  racha: { icono: Flame, titulo: (l) => `${l.cantidad} días seguidos en tu rango`, texto: 'La constancia es lo que mueve la aguja.' },
  dia: { icono: CircleCheck, titulo: () => 'Día cumplido', texto: 'Quedaste dentro de tu rango de kcal.' },
}

/** RF-24 · Terminar el día: cierra la jornada y celebra cada logro una sola vez. */
export function TerminarDia({ userId, hoy, eventos, kcal, rango, cumplido, racha, kgAvanzados, metaAlcanzada, faseInicio }: Props) {
  const [logros, setLogros] = useState<Logro[]>([])
  const terminado = clavesDe(eventos, 'dia_terminado').has(hoy)

  const terminar = async () => {
    const nuevos = logrosAlTerminar({ hoy, cumplido, racha, kgAvanzados, metaAlcanzada, faseInicio, celebrados: clavesDe(eventos, 'celebracion') })
    const dia = await registrarEvento(userId, 'dia_terminado', hoy, String(Math.round(kcal)), hoy)
    const celebraciones = await Promise.all(nuevos.map((l) => registrarEvento(userId, 'celebracion', l.clave, String(l.cantidad), hoy)))
    vibrar(nuevos.length ? 30 : 12)
    setLogros(nuevos)
    if (nuevos.length === 0) {
      toast(cumplido ? 'Día terminado' : 'Día terminado fuera de tu rango', {
        description: cumplido ? undefined : 'Mañana es otro día: lo que cuenta es tu promedio semanal.',
        action: {
          label: 'Deshacer',
          onClick: () => void Promise.all([deshacerEvento(dia), ...celebraciones.map(deshacerEvento)]),
        },
      })
    }
  }

  return (
    <>
      {logros.length > 0 ? (
        <m.div key="logros" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 18 }}>
          <Tarjeta className="border-exito/50" role="status" aria-live="polite">
            <p className="rotulo">Día terminado</p>
            <ul className="mt-3 flex flex-col gap-3">
              {logros.map((l, i) => {
                const x = LOGRO[l.tipo]
                return (
                  <m.li
                    key={l.clave}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.12, type: 'spring', damping: 16 }}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-superficie-elevada" aria-hidden>
                      <x.icono className="size-6 text-exito" />
                    </span>
                    <span>
                      <span className="block font-semibold">{x.titulo(l)}</span>
                      <span className="block text-sm text-texto-secundario">{x.texto}</span>
                    </span>
                  </m.li>
                )
              })}
            </ul>
            <Boton tamano="sm" variante="secundario" className="mt-4" onClick={() => setLogros([])}>
              Listo
            </Boton>
          </Tarjeta>
        </m.div>
      ) : terminado ? (
        <m.p key="hecho" className="flex items-center gap-2 text-sm text-texto-secundario" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <MoonStar className="size-4" aria-hidden /> Día terminado con {formatoNumero(kcal)} kcal. Puedes seguir registrando si comes algo más.
        </m.p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Boton variante="secundario" onClick={() => void terminar()}>
            <MoonStar aria-hidden /> Terminar día
          </Boton>
          <p className="text-sm text-texto-secundario">
            Llevas <span className="num font-semibold text-texto">{formatoNumero(kcal)}</span> kcal · tu rango es{' '}
            <span className="num">{formatoNumero(rango.min)}</span>–<span className="num">{formatoNumero(rango.max)}</span>
          </p>
        </div>
      )}
    </>
  )
}
