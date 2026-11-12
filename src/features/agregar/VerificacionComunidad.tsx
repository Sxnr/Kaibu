// Estado de un aporte de la comunidad y botones para confirmar que coincide con la etiqueta o avisar un error.
import { useLiveQuery } from 'dexie-react-hooks'
import { BadgeCheck, Flag, ShieldQuestion, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { db, type Voto } from '@/data/db'
import { guardar } from '@/data/escritura'
import { estadoAporte } from '@/domain/alimentos/comunidad'
import type { Alimento } from '@/domain/alimentos/tipos'
import { cn } from '@/lib/utils'

export function VerificacionComunidad({ comunidad }: { comunidad: NonNullable<Alimento['comunidad']> }) {
  const userId = useUsuario()
  const miVoto = useLiveQuery(() => db.votos.get([comunidad.id, userId]), [comunidad.id, userId])
  const { verificado, texto } = estadoAporte(comunidad)
  const esMio = comunidad.userId === userId
  const votoActual = miVoto && !miVoto.deletedAt ? miVoto.voto : null
  const Icono = verificado ? BadgeCheck : ShieldQuestion

  const votar = async (voto: Voto['voto']) => {
    const anterior = miVoto
    await guardar('votos', { foodId: comunidad.id, userId, voto, updatedAt: '', deletedAt: null })
    toast(voto === 'confirma' ? 'Gracias: confirmaste que coincide con la etiqueta' : 'Gracias: avisaste que tiene un error', {
      action: {
        label: 'Deshacer',
        onClick: () =>
          void guardar('votos', anterior ?? { foodId: comunidad.id, userId, voto, updatedAt: '', deletedAt: new Date().toISOString() }),
      },
    })
  }

  return (
    <section aria-label="Aporte de la comunidad" className="flex flex-col gap-3 rounded-2xl border border-borde p-3">
      <p className={cn('flex items-center gap-2 text-sm font-semibold', verificado ? 'text-exito' : 'text-texto-secundario')}>
        <Icono className="size-5 shrink-0" aria-hidden />
        {texto}
      </p>
      {esMio ? (
        <p className="text-sm text-texto-secundario">Lo aportaste tú. Gracias por ayudar a completar el catálogo.</p>
      ) : (
        <>
          <p className="text-sm text-texto-secundario">¿Lo tienes a mano? Compara con la tabla nutricional del envase.</p>
          <div className="grid grid-cols-2 gap-2">
            <Boton variante={votoActual === 'confirma' ? 'primario' : 'secundario'} aria-pressed={votoActual === 'confirma'} onClick={() => void votar('confirma')}>
              <ThumbsUp aria-hidden /> Coincide
            </Boton>
            <Boton variante={votoActual === 'reporta' ? 'primario' : 'secundario'} aria-pressed={votoActual === 'reporta'} onClick={() => void votar('reporta')}>
              <Flag aria-hidden /> Tiene un error
            </Boton>
          </div>
        </>
      )}
    </section>
  )
}
