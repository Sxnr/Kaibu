import { MessagesSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useSesion } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import type { ParametrosPublicacion } from '@/domain/comunidad/publicarSemana'
import { INVITACION_DISCORD, leerVinculo, publicarSemana } from '@/features/comunidad/discord'

const ESPERA_DESHACER_MS = 5000

/**
 * "Publicar en el Discord": con el Discord vinculado, manda tus números a #progreso (con 5 s para deshacer).
 * Sin vínculo, solo un enlace discreto a la Comunidad.
 */
export function PublicarEnDiscord({ datos }: { datos: ParametrosPublicacion | null }) {
  const { modoLocal, enLinea } = useSesion()
  const [vinculado, setVinculado] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)
  const espera = useRef<number | null>(null)

  useEffect(() => {
    if (modoLocal || !enLinea) {
      setVinculado(false)
      return
    }
    let vigente = true
    leerVinculo()
      .then((v) => vigente && setVinculado(Boolean(v)))
      .catch(() => vigente && setVinculado(false))
    return () => {
      vigente = false
    }
  }, [modoLocal, enLinea])

  useEffect(() => () => {
    if (espera.current) window.clearTimeout(espera.current)
  }, [])

  if (vinculado === null) return null

  if (!vinculado) {
    if (!INVITACION_DISCORD) return null
    return (
      <p className="text-center text-sm text-texto-secundario">
        ¿Quieres mostrarla en la comunidad?{' '}
        <Link to="/comunidad" className="font-medium text-texto-marca underline underline-offset-2">
          Conoce el Discord de Kaibu
        </Link>
      </p>
    )
  }

  const publicar = () => {
    if (!datos) return
    setEnviando(true)
    espera.current = window.setTimeout(async () => {
      espera.current = null
      const r = await publicarSemana(datos).catch(() => 'error' as const)
      setEnviando(false)
      if (r === 'ok') toast.success('¡Listo! En un minuto aparece en #tarjetas-de-progreso.')
      else if (r === 'limite') toast.error('Ya publicaste 3 veces hoy. Vuelve a intentarlo mañana.')
      else if (r === 'sin_vinculo') toast.error('Tu Discord ya no está vinculado. Vincúlalo de nuevo en Comunidad.')
      else toast.error('No pudimos publicarla. Revisa tu conexión e intenta de nuevo.')
    }, ESPERA_DESHACER_MS)
    toast('Tu semana se publicará en el Discord de Kaibu con tu nombre.', {
      duration: ESPERA_DESHACER_MS,
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (espera.current) window.clearTimeout(espera.current)
          espera.current = null
          setEnviando(false)
        },
      },
    })
  }

  return (
    <Boton variante="secundario" ancho="completo" onClick={publicar} disabled={!datos || enviando}>
      <MessagesSquare aria-hidden /> {enviando ? 'Publicando…' : 'Publicar en el Discord'}
    </Boton>
  )
}
