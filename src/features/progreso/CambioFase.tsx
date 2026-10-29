import { Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Evento, Perfil } from '@/data/db'
import { guardar } from '@/data/escritura'
import { pasosTransicion } from '@/domain/calc/semana'
import type { Objetivo } from '@/domain/calc/types'
import { formatoNumero } from '@/domain/format/formato'
import { deshacerEvento, registrarEvento } from '@/features/plan/eventos'

type Destino = Extract<Objetivo, 'mantener' | 'ganar'>

interface Props {
  userId: string
  perfil: Perfil
  eventos: Evento[]
  kcalActual: number
  pesoActual: number
  /** kcal de la fase nueva (sin transición), calculadas con el peso actual. */
  kcalDestino: (destino: Destino) => number | null
  hoy: string
}

/** RF-12 · Al llegar a la meta: proponer mantener o volumen, subiendo 150 kcal por semana (RN-13). */
export function CambioFase({ userId, perfil, eventos, kcalActual, pesoActual, kcalDestino, hoy }: Props) {
  const clave = `fin:${perfil.faseInicio ?? 'sin-fase'}`
  if (eventos.some((e) => e.tipo === 'cambio_fase' && e.clave === clave)) return null
  const mantenimiento = kcalDestino('mantener')
  const semanas = mantenimiento ? Math.max(0, pasosTransicion(kcalActual, mantenimiento, hoy).length - 1) : 0

  const elegir = async (destino: Destino) => {
    const anterior = perfil
    const nuevas = kcalDestino(destino) ?? kcalActual
    const creados = [await registrarEvento(userId, 'cambio_fase', clave, destino, hoy)]
    for (const p of pasosTransicion(kcalActual, nuevas, hoy)) {
      creados.push(await registrarEvento(userId, 'ajuste_semanal', p.clave, String(p.valor), p.fecha))
    }
    await guardar('perfiles', {
      ...perfil,
      objetivo: destino,
      velocidad: destino === 'ganar' ? 'lenta' : perfil.velocidad,
      pesoInicial: pesoActual,
      pesoMeta: destino === 'mantener' ? pesoActual : null,
      faseInicio: hoy,
      kcalManual: null,
    })
    toast(destino === 'mantener' ? 'Nueva fase: mantenimiento' : 'Nueva fase: volumen', {
      description:
        destino === 'mantener'
          ? 'Subiremos tus kcal de a poco cada semana.'
          : 'Subiremos tus kcal de a poco. Define tu peso meta en Ajustes › Mis datos.',
      action: {
        label: 'Deshacer',
        onClick: () => void Promise.all([guardar('perfiles', anterior), ...creados.map(deshacerEvento)]),
      },
    })
  }

  return (
    <Tarjeta className="border-exito/50 lg:col-span-3" aria-labelledby="cambio-fase-titulo">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-superficie-elevada" aria-hidden>
          <Trophy className="size-6 text-exito" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="rotulo">Meta de fase alcanzada</p>
          <h2 id="cambio-fase-titulo" className="mt-1 text-xl font-semibold">
            ¿Cuál es tu próxima fase?
          </h2>
          <p className="mt-1 text-sm text-texto-secundario">
            Para no recuperar lo logrado, subimos tus kcal de a poco: 150 kcal más cada semana
            {mantenimiento && semanas > 0 && (
              <>
                {' '}
                durante <span className="num font-semibold text-texto">{semanas}</span> {semanas === 1 ? 'semana' : 'semanas'}, hasta tu mantenimiento de{' '}
                <span className="num font-semibold text-texto">{formatoNumero(mantenimiento)} kcal</span>
              </>
            )}
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Boton tamano="sm" onClick={() => void elegir('mantener')}>
              Mantener mi peso
            </Boton>
            <Boton tamano="sm" variante="secundario" onClick={() => void elegir('ganar')}>
              Pasar a volumen
            </Boton>
          </div>
        </div>
      </div>
    </Tarjeta>
  )
}
