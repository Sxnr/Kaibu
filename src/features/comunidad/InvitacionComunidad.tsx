import { MessagesSquare, X } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import { descartar } from '@/domain/comunidad/descubrir'
import { actualizarDescubrir } from './descubrirEstado'

/** Tarjeta discreta en Hoy: la Comunidad existe. "Ahora no" la esconde 14 días (y tras 2 veces, para siempre). */
export function InvitacionComunidad({ hoy }: { hoy: string }) {
  const reducir = useReducedMotion()
  return (
    <m.div initial={reducir ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <MessagesSquare className="size-6 shrink-0 text-texto-marca" aria-hidden />
        <div className="flex-1">
          <h2 className="font-semibold">¿Sabías que Kaibu tiene comunidad?</h2>
          <p className="mt-0.5 text-sm text-texto-secundario">
            Comparte tu semana, gana roles por racha, propone ideas y postula a la beta en el Discord de Kaibu.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Boton asChild tamano="sm">
            <Link to="/comunidad">Conocer la comunidad</Link>
          </Boton>
          <Boton variante="fantasma" tamano="sm" onClick={() => actualizarDescubrir((e) => descartar(e, hoy))}>
            <X aria-hidden /> Ahora no
          </Boton>
        </div>
      </Tarjeta>
    </m.div>
  )
}
