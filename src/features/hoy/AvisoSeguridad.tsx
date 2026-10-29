import { TriangleAlert, X } from 'lucide-react'
import { Boton } from '@/components/ui/button'
import type { Evento, Perfil } from '@/data/db'
import type { AvisoSeguridad as TipoAviso } from '@/domain/calc/ajustes'
import { avisosPendientes, claveAviso } from '@/domain/calc/celebraciones'
import { clavesDe, registrarEvento } from '@/features/plan/eventos'
import { textoAviso } from '@/features/plan/textos'

interface Props {
  userId: string
  perfil: Perfil
  avisos: TipoAviso[]
  eventos: Evento[]
  hoy: string
}

/** RF-11 · Aviso respetuoso: no bloquea y no se repite por la misma causa en la fase. */
export function AvisoSeguridad({ userId, perfil, avisos, eventos, hoy }: Props) {
  const pendientes = avisosPendientes(avisos, clavesDe(eventos, 'aviso_seguridad'), perfil.faseInicio)
  const texto = textoAviso(pendientes, perfil.sexo)
  if (!texto) return null

  const entendido = async () => {
    for (const a of pendientes) await registrarEvento(userId, 'aviso_seguridad', claveAviso(a, perfil.faseInicio), null, hoy)
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-alerta/50 bg-superficie p-4" role="note" aria-label="Aviso de salud">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-alerta" aria-hidden />
      <p className="flex-1 text-sm">{texto}</p>
      <Boton tamano="icono" variante="fantasma" onClick={() => void entendido()} aria-label="Entendido, cerrar el aviso" className="-m-2">
        <X aria-hidden />
      </Boton>
    </div>
  )
}
