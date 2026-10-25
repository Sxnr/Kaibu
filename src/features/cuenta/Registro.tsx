import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { guardarConsentimientoPendiente } from '@/app/consentimiento'
import { useSesion } from '@/app/useSesion'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { obtenerSupabase } from '@/data/supabase'
import { VERSION_SALUD, VERSION_TERMINOS } from '@/domain/legal'
import { CasillasConsentimiento } from './Consentimientos'
import { CampoContrasena } from './CampoContrasena'
import { mensajeErrorAuth } from './errores'
import { IconoGoogle, PantallaCuenta, Separador } from './PantallaCuenta'

const esquemaConsentimiento = {
  terminos: z.boolean().refine((v) => v, 'Para continuar, acepta los Términos y Condiciones.'),
  salud: z.boolean().refine((v) => v, 'Para continuar, da tu consentimiento para tratar tus datos de salud.'),
}

const esquema = z.object({
  email: z.email('Escribe un correo válido, por ejemplo nombre@correo.cl.'),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  ...esquemaConsentimiento,
})
type Datos = z.infer<typeof esquema>

const consentimiento = () => guardarConsentimientoPendiente({ terminos: VERSION_TERMINOS, datos_salud: VERSION_SALUD })

export default function Registro() {
  const { modoLocal, entrarLocal } = useSesion()
  const navegar = useNavigate()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [correoEnviado, setCorreoEnviado] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '', contrasena: '', terminos: false, salud: false },
  })

  const errorConsentimiento = errors.terminos?.message ?? errors.salud?.message

  const crear = handleSubmit(async ({ email, contrasena }) => {
    setErrorGeneral(null)
    const supabase = await obtenerSupabase()
    if (!supabase) return
    consentimiento()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) return setErrorGeneral(mensajeErrorAuth(error))
    if (data.session) navegar('/', { replace: true })
    else setCorreoEnviado(email)
  })

  const conGoogle = async () => {
    setErrorGeneral(null)
    const ok = await trigger(['terminos', 'salud'])
    const supabase = await obtenerSupabase()
    if (!ok || !supabase) return
    consentimiento()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) setErrorGeneral(mensajeErrorAuth(error))
  }

  const usarLocal = async () => {
    const ok = await trigger(['terminos', 'salud'])
    if (!ok) return
    consentimiento()
    entrarLocal()
    navegar('/', { replace: true })
  }

  if (correoEnviado) {
    return (
      <PantallaCuenta titulo="Revisa tu correo">
        <EstadoVacio
          icono={MailCheck}
          titulo="Confirma tu cuenta"
          texto={`Te enviamos un enlace a ${correoEnviado}. Ábrelo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.`}
          accion={
            <Boton asChild variante="secundario">
              <Link to="/entrar">Ir a iniciar sesión</Link>
            </Boton>
          }
        />
      </PantallaCuenta>
    )
  }

  const consentimientos = (
    <Controller
      control={control}
      name="terminos"
      render={({ field: t }) => (
        <Controller
          control={control}
          name="salud"
          render={({ field: s }) => (
            <CasillasConsentimiento
              terminos={t.value}
              salud={s.value}
              alCambiarTerminos={t.onChange}
              alCambiarSalud={s.onChange}
              error={errorConsentimiento}
            />
          )}
        />
      )}
    />
  )

  if (modoLocal) {
    return (
      <PantallaCuenta titulo="Crea tu cuenta" subtitulo="Empieza tu plan en menos de 2 minutos.">
        <div className="flex gap-3 rounded-2xl border border-borde bg-superficie-elevada p-4 text-sm" role="note">
          <Smartphone className="size-5 shrink-0 text-texto-marca" aria-hidden />
          <p>
            <strong>Modo local.</strong> Las cuentas aún no están activadas (falta conectar Supabase). Puedes usar Kaibu y tus datos
            quedarán solo en este dispositivo.
          </p>
        </div>
        {consentimientos}
        <Boton ancho="completo" onClick={usarLocal}>
          Usar en este dispositivo
        </Boton>
      </PantallaCuenta>
    )
  }

  return (
    <PantallaCuenta titulo="Crea tu cuenta" subtitulo="Empieza tu plan en menos de 2 minutos.">
      <form onSubmit={crear} noValidate className="flex flex-col gap-5">
        <Campo etiqueta="Correo" error={errors.email?.message}>
          {(a) => <Entrada type="email" autoComplete="email" inputMode="email" {...a} {...register('email')} />}
        </Campo>
        <CampoContrasena etiqueta="Contraseña" autoComplete="new-password" error={errors.contrasena?.message} ayuda="Mínimo 8 caracteres." registro={register('contrasena')} />
        {consentimientos}
        {errorGeneral && (
          <p role="alert" className="rounded-xl bg-superficie-elevada p-3 text-sm font-medium text-texto-marca">
            {errorGeneral}
          </p>
        )}
        <Boton type="submit" ancho="completo" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Boton>
      </form>
      <Separador />
      <Boton variante="contorno" ancho="completo" onClick={conGoogle}>
        <IconoGoogle />
        Continuar con Google
      </Boton>
      <p className="text-center text-sm text-texto-secundario">
        ¿Ya tienes cuenta?{' '}
        <Link to="/entrar" className="font-semibold text-texto-marca underline underline-offset-2">
          Inicia sesión
        </Link>
      </p>
    </PantallaCuenta>
  )
}
