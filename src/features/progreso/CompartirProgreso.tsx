import { Download, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Casilla } from '@/components/ui/checkbox'
import { Hoja } from '@/components/ui/hoja'
import { useRegistrosRango } from '@/data/consultas'
import { tarjetaCompartir } from '@/domain/calc/compartir'
import type { DiaNutricion, Periodo, ResumenPeriodo } from '@/domain/calc/resumenSemanal'
import type { Objetivo } from '@/domain/calc/types'
import { sumarDias } from '@/domain/format/formato'
import { rachaActual } from '@/features/hoy/resumenDia'
import { debeSugerirTrasCompartir, marcarSugerida } from '@/domain/comunidad/descubrir'
import { datosPublicacion } from '@/domain/comunidad/publicarSemana'
import { actualizarDescubrir, useDescubrirComunidad } from '@/features/comunidad/descubrirEstado'
import { INVITACION_DISCORD } from '@/features/comunidad/discord'
import { PublicarEnDiscord } from './PublicarEnDiscord'
import { compartirODescargar, generarImagenProgreso } from './imagenProgreso'

export interface DatosFase {
  objetivo: Objetivo
  kgAvanzados: number
  /** Promedio de 7 días; solo aparece en la imagen si la persona lo pide. */
  pesoKg: number | null
}

interface Props extends DatosFase {
  abierta: boolean
  alCambiar: (v: boolean) => void
  userId: string
  resumen: ResumenPeriodo
  periodo: Periodo
  dias: DiaNutricion[]
  rango: { min: number; max: number }
  metaKcal: number
  hoy: string
}

/** Imagen para historias con el progreso del período (sin peso exacto por defecto). */
export function CompartirProgreso({ abierta, alCambiar, ...resto }: Props) {
  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo="Compartir mi progreso" descripcion="Una imagen para tus historias. Tu peso no aparece, a menos que tú lo actives.">
      {abierta && <Contenido {...resto} />}
    </Hoja>
  )
}

function Contenido({ userId, resumen, periodo, dias, rango, metaKcal, hoy, objetivo, kgAvanzados, pesoKg }: Omit<Props, 'abierta' | 'alCambiar'>) {
  const [mostrarPeso, setMostrarPeso] = useState(false)
  const [imagen, setImagen] = useState<{ blob: Blob; url: string } | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const navegar = useNavigate()
  const descubrir = useDescubrirComunidad()
  // Un año hacia atrás alcanza para la racha (igual que en Hoy).
  const registros = useRegistrosRango(userId, sumarDias(hoy, -366), hoy)
  const racha = useMemo(() => (registros ? rachaActual(registros, metaKcal, hoy) : null), [registros, metaKcal, hoy])
  const tarjeta = useMemo(
    () => (racha === null ? null : tarjetaCompartir({ resumen, periodo, racha, kgAvanzados, objetivo, pesoKg, mostrarPeso })),
    [resumen, periodo, racha, kgAvanzados, objetivo, pesoKg, mostrarPeso],
  )

  useEffect(() => {
    if (!tarjeta) return
    let vigente = true
    let url: string | null = null
    generarImagenProgreso({ tarjeta, dias, rango, hoy })
      .then((blob) => {
        if (!vigente) return
        url = URL.createObjectURL(blob)
        setImagen({ blob, url })
      })
      .catch(() => toast.error('No pudimos crear la imagen en este navegador.'))
    return () => {
      vigente = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [tarjeta, dias, rango, hoy])

  const compartir = async () => {
    if (!imagen || !tarjeta) return
    setCompartiendo(true)
    const resultado = await compartirODescargar(imagen.blob, tarjeta.titulo)
    setCompartiendo(false)
    if (resultado === 'descargada') toast.success('Imagen descargada. Súbela a tus historias desde tu galería.')
    // Una sola vez: contarle que también puede mostrarla en la comunidad.
    if (resultado !== 'cancelada' && INVITACION_DISCORD && debeSugerirTrasCompartir(descubrir)) {
      actualizarDescubrir(marcarSugerida)
      toast('¿La compartes también en la comunidad de Kaibu?', {
        duration: 8000,
        action: { label: 'Ver comunidad', onClick: () => navegar('/comunidad') },
      })
    }
  }

  const publicacion = useMemo(
    () => (racha === null ? null : datosPublicacion({ resumen, periodo, racha, objetivo, kgAvanzados, pesoKg, mostrarPeso })),
    [resumen, periodo, racha, objetivo, kgAvanzados, pesoKg, mostrarPeso],
  )

  // Solo se ofrece "Compartir" si el navegador acepta compartir imágenes; si no, se descarga.
  const puedeCompartir = useMemo(() => {
    try {
      return navigator.canShare?.({ files: [new File([''], 'prueba.png', { type: 'image/png' })] }) ?? false
    } catch {
      return false
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto aspect-[9/16] w-full max-w-[15rem] overflow-hidden rounded-2xl border border-borde bg-superficie-elevada">
        {imagen ? (
          <img src={imagen.url} alt={tarjeta ? `${tarjeta.titulo}: ${tarjeta.datos.map((d) => `${d.valor} ${d.etiqueta}`).join(', ')}` : ''} className="size-full object-cover" />
        ) : (
          <p className="grid size-full place-items-center text-sm text-texto-secundario">Creando imagen…</p>
        )}
      </div>

      {pesoKg !== null && (
        <div className="flex items-center gap-3">
          <Casilla id="mostrar-peso" checked={mostrarPeso} onCheckedChange={(v) => setMostrarPeso(v === true)} />
          <label htmlFor="mostrar-peso" className="text-sm">
            Mostrar mi peso en la imagen
          </label>
        </div>
      )}

      <Boton ancho="completo" onClick={compartir} disabled={!imagen || compartiendo}>
        {puedeCompartir ? <Share2 aria-hidden /> : <Download aria-hidden />}
        {puedeCompartir ? 'Compartir imagen' : 'Descargar imagen'}
      </Boton>
      <PublicarEnDiscord datos={publicacion} />
    </div>
  )
}
