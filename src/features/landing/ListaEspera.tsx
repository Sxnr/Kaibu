import { zodResolver } from '@hookform/resolvers/zod'
import { BellRing, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { modoLocal, obtenerSupabase } from '@/data/supabase'
import { VERSION_PRIVACIDAD } from '@/domain/legal'

const esquema = z.object({
  email: z.email('Escribe un correo válido, por ejemplo nombre@correo.cl.').max(254),
  acepto: z.boolean().refine((v) => v, 'Para inscribirte, acepta que te escribamos solo para esto.'),
  // Campo trampa: las personas no lo ven; si viene con texto, es un bot.
  sitio: z.string().optional(),
})
type Datos = z.infer<typeof esquema>

type Estado = 'formulario' | 'listo' | 'error'

/** RF-67 · Lista de espera: aviso del lanzamiento y encuesta de precio (ON-09). */
export function ListaEspera() {
  const [estado, setEstado] = useState<Estado>('formulario')
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { email: '', acepto: false, sitio: '' } })

  const inscribir = handleSubmit(async ({ email, sitio }) => {
    if (sitio) return setEstado('listo')
    const supabase = await obtenerSupabase()
    if (!supabase) return setEstado('error')
    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase(), consentimiento: true, version_consentimiento: VERSION_PRIVACIDAD })
    // Un correo repetido también se muestra como inscrito: así no se revela quién ya está en la lista.
    setEstado(!error || error.code === '23505' ? 'listo' : 'error')
  })

  return (
    <section id="lista-espera" aria-labelledby="titulo-lista" className="scroll-mt-20 border-t border-borde bg-superficie">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="rotulo flex items-center gap-2">
            <BellRing className="size-4 text-texto-marca" aria-hidden /> Lista de espera
          </p>
          <h2 id="titulo-lista" className="titular mt-3 text-4xl sm:text-5xl">
            Te avisamos cuando lleguemos a tu celular.
          </h2>
          <p className="mt-3 text-lg text-texto-secundario">
            Kaibu llega pronto a Android e iPhone. Déjanos tu correo y te avisamos el día del lanzamiento. Te escribiremos solo para eso y para una
            encuesta corta.
          </p>
        </div>

        {estado === 'listo' ? (
          <div className="flex items-start gap-4 rounded-tarjeta border border-borde bg-fondo p-6" role="status">
            <MailCheck className="size-8 shrink-0 text-exito" aria-hidden />
            <div>
              <p className="text-lg font-semibold">¡Listo, estás en la lista!</p>
              <p className="mt-1 text-texto-secundario">Cada correo trae un enlace para darte de baja cuando quieras.</p>
            </div>
          </div>
        ) : modoLocal ? (
          <p className="rounded-tarjeta border border-borde bg-fondo p-6 text-texto-secundario" role="note">
            La lista de espera se activa cuando Kaibu esté publicado en línea. Mientras tanto puedes{' '}
            <Link to="/registro" className="font-semibold text-texto-marca underline underline-offset-2">
              usar la app en este dispositivo
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={inscribir} noValidate className="flex flex-col gap-4 rounded-tarjeta border border-borde bg-fondo p-6">
            <Campo etiqueta="Tu correo" error={errors.email?.message}>
              {(a) => <Entrada type="email" autoComplete="email" placeholder="nombre@correo.cl" {...a} {...register('email')} />}
            </Campo>
            <div className="hidden" aria-hidden>
              <label htmlFor="sitio-web">No llenes este campo</label>
              <input id="sitio-web" tabIndex={-1} autoComplete="off" {...register('sitio')} />
            </div>
            <Controller
              control={control}
              name="acepto"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <Casilla
                      id="acepto-lista"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      aria-invalid={!!errors.acepto}
                      aria-describedby={errors.acepto ? 'acepto-lista-error' : undefined}
                      className="mt-0.5"
                    />
                    <label htmlFor="acepto-lista" className="text-sm">
                      Acepto que Kaibu guarde mi correo para avisarme del lanzamiento y enviarme una encuesta, según la{' '}
                      <Link to="/legal/privacidad" className="font-semibold text-texto-marca underline underline-offset-2">
                        Política de Privacidad
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.acepto && (
                    <p id="acepto-lista-error" role="alert" className="text-sm font-medium text-texto-marca">
                      {errors.acepto.message}
                    </p>
                  )}
                </div>
              )}
            />
            {estado === 'error' && (
              <p role="alert" className="text-sm font-medium text-texto-marca">
                No pudimos guardar tu correo. Revisa tu conexión e inténtalo de nuevo.
              </p>
            )}
            <Boton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Avísame'}
            </Boton>
          </form>
        )}
      </div>
    </section>
  )
}
