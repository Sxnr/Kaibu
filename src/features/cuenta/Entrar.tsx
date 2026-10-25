import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useSesion } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { obtenerSupabase } from '@/data/supabase'
import { CampoContrasena } from './CampoContrasena'
import { mensajeErrorAuth } from './errores'
import { IconoGoogle, PantallaCuenta, Separador } from './PantallaCuenta'

const esquema = z.object({
  email: z.email('Escribe un correo válido, por ejemplo nombre@correo.cl.'),
  contrasena: z.string().min(1, 'Escribe tu contraseña.'),
})
type Datos = z.infer<typeof esquema>

export default function Entrar() {
  const { modoLocal } = useSesion()
  const navegar = useNavigate()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { email: '', contrasena: '' } })

  const entrar = handleSubmit(async ({ email, contrasena }) => {
    setErrorGeneral(null)
    const supabase = await obtenerSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena })
    if (error) return setErrorGeneral(mensajeErrorAuth(error))
    navegar('/', { replace: true })
  })

  const conGoogle = async () => {
    const supabase = await obtenerSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } })
    if (error) setErrorGeneral(mensajeErrorAuth(error))
  }

  if (modoLocal) {
    return (
      <PantallaCuenta titulo="Inicia sesión" subtitulo="Las cuentas se activan cuando se conecte Supabase.">
        <Boton asChild ancho="completo">
          <Link to="/registro">Usar Kaibu en este dispositivo</Link>
        </Boton>
      </PantallaCuenta>
    )
  }

  return (
    <PantallaCuenta titulo="Inicia sesión" subtitulo="Qué bueno verte de nuevo.">
      <form onSubmit={entrar} noValidate className="flex flex-col gap-5">
        <Campo etiqueta="Correo" error={errors.email?.message}>
          {(a) => <Entrada type="email" autoComplete="email" inputMode="email" {...a} {...register('email')} />}
        </Campo>
        <CampoContrasena etiqueta="Contraseña" autoComplete="current-password" error={errors.contrasena?.message} registro={register('contrasena')} />
        <Link to="/recuperar" className="-mt-2 self-end py-2 text-sm font-semibold text-texto-marca underline underline-offset-2">
          ¿Olvidaste tu contraseña?
        </Link>
        {errorGeneral && (
          <p role="alert" className="rounded-xl bg-superficie-elevada p-3 text-sm font-medium text-texto-marca">
            {errorGeneral}
          </p>
        )}
        <Boton type="submit" ancho="completo" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
      <Separador />
      <Boton variante="contorno" ancho="completo" onClick={conGoogle}>
        <IconoGoogle />
        Continuar con Google
      </Boton>
      <p className="text-center text-sm text-texto-secundario">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-texto-marca underline underline-offset-2">
          Crea una
        </Link>
      </p>
    </PantallaCuenta>
  )
}
