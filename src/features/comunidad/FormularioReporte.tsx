import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { esApk, esApp } from '@/app/plataforma'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { Hoja } from '@/components/ui/hoja'
import { ahoraISO, nuevoId, type Reporte } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { LIMITE_DIARIO, describirPlataforma, enviosUltimas24h, type TipoReporte } from '@/domain/comunidad/reportes'
import { formatoNumero } from '@/domain/format/formato'

const MAX_DESCRIPCION = 1500

const esquema = (tipo: TipoReporte) =>
  z.object({
    titulo:
      tipo === 'sugerencia'
        ? z.string().trim().min(3, 'Ponle un título corto (3 letras o más).').max(100, 'Máximo 100 caracteres.')
        : z.string().trim().max(100, 'Máximo 100 caracteres.'),
    descripcion: z.string().trim().min(10, 'Cuéntanos un poco más (10 letras o más).').max(MAX_DESCRIPCION, `Máximo ${MAX_DESCRIPCION} caracteres.`),
  })
type Datos = z.infer<ReturnType<typeof esquema>>

const TEXTOS: Record<TipoReporte, { titulo: string; descripcion: string; etiquetaTexto: string; ayudaTexto: string; privacidad: string; enviar: string }> = {
  bug: {
    titulo: 'Reportar un problema',
    descripcion: 'Llega al equipo de Kaibu por Discord. Solo lo ve el equipo.',
    etiquetaTexto: '¿Qué pasó y cómo repetirlo?',
    ayudaTexto: 'En qué pantalla estabas, qué tocaste y qué esperabas que pasara.',
    privacidad: 'Se envía con tu plataforma y la versión de la app, sin tu nombre ni tu correo.',
    enviar: 'Enviar reporte',
  },
  sugerencia: {
    titulo: 'Enviar una sugerencia',
    descripcion: 'Se publica en el Discord de Kaibu para que la comunidad la vote.',
    etiquetaTexto: '¿Cómo te ayudaría?',
    ayudaTexto: 'Qué te gustaría que Kaibu hiciera y para qué lo usarías.',
    privacidad: 'Se publica sin tu nombre; si vinculaste tu Discord, aparece tu usuario de Discord.',
    enviar: 'Enviar sugerencia',
  },
}

interface Props {
  tipo: TipoReporte | null
  alCerrar: () => void
  userId: string
  /** En modo local no hay cuenta: se puede escribir, pero no enviar. */
  puedeEnviar: boolean
  reportes: Reporte[]
}

/** Hoja con el formulario de reporte o sugerencia. Se guarda en el dispositivo y se envía al volver la conexión. */
export function FormularioReporte({ tipo, alCerrar, userId, puedeEnviar, reportes }: Props) {
  return (
    <Hoja abierta={tipo !== null} alCambiar={(v) => !v && alCerrar()} titulo={tipo ? TEXTOS[tipo].titulo : ''} descripcion={tipo ? TEXTOS[tipo].descripcion : undefined}>
      {tipo && <Contenido key={tipo} tipo={tipo} alCerrar={alCerrar} userId={userId} puedeEnviar={puedeEnviar} reportes={reportes} />}
    </Hoja>
  )
}

function Contenido({ tipo, alCerrar, userId, puedeEnviar, reportes }: Props & { tipo: TipoReporte }) {
  const t = TEXTOS[tipo]
  const idCasilla = useId()
  const [sinConexion, setSinConexion] = useState(false)
  const plataforma = describirPlataforma({ userAgent: navigator.userAgent, instalada: esApp(), apk: esApk() })
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema(tipo)), defaultValues: { titulo: '', descripcion: '' } })
  const largo = watch('descripcion')?.length ?? 0
  const limiteAlcanzado = enviosUltimas24h(reportes) >= LIMITE_DIARIO

  const enviar = handleSubmit(async (d) => {
    const ahora = ahoraISO()
    const fila: Reporte = {
      id: nuevoId(),
      userId,
      tipo,
      titulo: d.titulo || null,
      descripcion: d.descripcion,
      plataforma,
      versionApp: __VERSION__,
      sinConexion: tipo === 'bug' && sinConexion,
      estado: 'enviado',
      createdAt: ahora,
      updatedAt: ahora,
      deletedAt: null,
    }
    const guardado = await guardar('reportes', fila)
    alCerrar()
    toast.success(tipo === 'bug' ? '¡Gracias! Tu reporte va camino al equipo.' : '¡Gracias! Tu sugerencia se publicará en el Discord.', {
      description: navigator.onLine ? 'Lo verás en "Tus envíos" con su estado.' : 'Se enviará apenas vuelva la conexión.',
      action: { label: 'Deshacer', onClick: () => void borrar('reportes', guardado) },
    })
  })

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <Campo etiqueta={tipo === 'sugerencia' ? 'Título' : 'Título (opcional)'} error={errors.titulo?.message}>
        {(p) => <Entrada {...p} {...register('titulo')} maxLength={100} placeholder={tipo === 'sugerencia' ? 'Ej.: metas distintas los días de entreno' : 'Ej.: no se guarda el agua'} />}
      </Campo>
      <Campo etiqueta={t.etiquetaTexto} error={errors.descripcion?.message} ayuda={t.ayudaTexto}>
        {(p) => (
          <textarea
            {...p}
            {...register('descripcion')}
            rows={5}
            maxLength={MAX_DESCRIPCION}
            className="min-h-32 w-full resize-y rounded-xl border border-borde-control bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-secundario focus-visible:border-foco aria-[invalid=true]:border-texto-marca"
          />
        )}
      </Campo>
      <p className="-mt-2 text-right text-xs text-texto-secundario">
        {formatoNumero(largo)} de {formatoNumero(MAX_DESCRIPCION)} caracteres
      </p>
      {tipo === 'bug' && (
        <div className="flex items-center gap-3">
          <Casilla id={idCasilla} checked={sinConexion} onCheckedChange={(v) => setSinConexion(v === true)} />
          <label htmlFor={idCasilla} className="text-sm">
            Pasó sin conexión a internet
          </label>
        </div>
      )}
      <p className="rounded-xl bg-superficie-elevada p-3 text-sm text-texto-secundario">
        {t.privacidad} <span className="text-texto">Se enviará: {plataforma} · Kaibu {__VERSION__}</span>
      </p>
      {!puedeEnviar && (
        <p role="alert" className="text-sm font-medium text-texto-marca">
          Estás usando Kaibu sin cuenta: para enviarlo desde la app necesitas una cuenta. Mientras, puedes contarnos en el Discord de Kaibu.
        </p>
      )}
      {puedeEnviar && limiteAlcanzado && (
        <p role="alert" className="text-sm font-medium text-texto-marca">
          Ya enviaste {LIMITE_DIARIO} reportes o sugerencias en las últimas 24 horas. Vuelve a intentarlo mañana.
        </p>
      )}
      <Boton type="submit" ancho="completo" disabled={!puedeEnviar || limiteAlcanzado || isSubmitting}>
        {t.enviar}
      </Boton>
    </form>
  )
}
