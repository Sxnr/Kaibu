// "Descargar para Android": lleva al APK más reciente (kaibu-nine.vercel.app/descargar/android → GitHub Releases).
// En iPhone muestra cómo agregar Kaibu a la pantalla de inicio. Dentro de la app de Android no se muestra.
import { Download, Share } from 'lucide-react'
import { esApp, sistemaDelEquipo } from '@/app/plataforma'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const RUTA_DESCARGA_ANDROID = '/descargar/android'

interface Props {
  /** Estilo del botón (en la portada va redondeado sobre la imagen). */
  className?: string
  /** "compacto": solo el enlace, para el pie de página. */
  compacto?: boolean
}

export function BotonAndroid({ className, compacto = false }: Props) {
  if (esApp()) return null
  const sistema = sistemaDelEquipo(navigator.userAgent)

  if (compacto) {
    return (
      <a href={RUTA_DESCARGA_ANDROID} className={cn('hover:underline', className)}>
        Descargar para Android
      </a>
    )
  }

  if (sistema === 'ios') {
    return (
      <p className={cn('flex items-center gap-2 text-sm', className)}>
        <Share className="size-4 shrink-0" aria-hidden />
        En iPhone: toca Compartir y luego "Agregar a pantalla de inicio".
      </p>
    )
  }

  return (
    <div className={cn('flex flex-col items-start gap-1.5', className)}>
      <Boton asChild variante="contorno" className="rounded-full bg-fondo/40 px-6 backdrop-blur">
        <a href={RUTA_DESCARGA_ANDROID}>
          <Download aria-hidden /> Descargar para Android
        </a>
      </Boton>
      <span className="text-xs">Beta privada: para crear tu cuenta necesitas tu código. Android 7 o superior.</span>
    </div>
  )
}
