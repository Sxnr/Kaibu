import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { obtenerSupabase } from '@/data/supabase'
import { mensajeErrorAuth } from './errores'
import { PantallaCuenta } from './PantallaCuenta'

const esquema = z.object({ email: z.email('Escribe un correo válido, por ejemplo nombre@correo.cl.') })

export default function Recuperar() {
  const [enviado, setEnviado] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(esquema), defaultValues: { email: '' } })

  const enviar = handleSubmit(async ({ email }) => {
    setErrorGeneral(null)
    const supabase = await obtenerSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` })
    if (error) return setErrorGeneral(mensajeErrorAuth(error))
    setEnviado(true)
  })

  return (
    <PantallaCuenta titulo="Recupera tu acceso" subtitulo="Te enviaremos un enlace para crear una contraseña nueva.">
      {enviado ? (
        <EstadoVacio
          icono={MailCheck}
          titulo="Revisa tu correo"
          texto="Si el correo tiene una cuenta en Kaibu, te llegará un enlace en unos minutos. Revisa también la carpeta de spam."
        />
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          <Campo etiqueta="Correo" error={errors.email?.message}>
            {(a) => <Entrada type="email" autoComplete="email" inputMode="email" {...a} {...register('email')} />}
          </Campo>
          {errorGeneral && (
            <p role="alert" className="text-sm font-medium text-texto-marca">
              {errorGeneral}
            </p>
          )}
          <Boton type="submit" ancho="completo" disabled={isSubmitting}>
            Enviar enlace
          </Boton>
        </form>
      )}
      <Link to="/entrar" className="text-center text-sm font-semibold text-texto-marca underline underline-offset-2">
        Volver a iniciar sesión
      </Link>
    </PantallaCuenta>
  )
}
