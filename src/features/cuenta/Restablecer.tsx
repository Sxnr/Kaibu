import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useSesion } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { obtenerSupabase } from '@/data/supabase'
import { CampoContrasena } from './CampoContrasena'
import { mensajeErrorAuth } from './errores'
import { PantallaCuenta } from './PantallaCuenta'

const esquema = z
  .object({
    contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    repetir: z.string(),
  })
  .refine((d) => d.contrasena === d.repetir, { path: ['repetir'], message: 'Las contraseñas no coinciden.' })
type Datos = z.infer<typeof esquema>

/** Se llega aquí desde el enlace del correo de recuperación. */
export default function Restablecer() {
  const { estado } = useSesion()
  const navegar = useNavigate()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { contrasena: '', repetir: '' } })

  const guardar = handleSubmit(async ({ contrasena }) => {
    const supabase = await obtenerSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password: contrasena })
    if (error) return setErrorGeneral(mensajeErrorAuth(error))
    toast.success('Contraseña actualizada')
    navegar('/', { replace: true })
  })

  if (estado === 'cargando') return <PantallaCargando />
  if (estado === 'anonimo') {
    return (
      <PantallaCuenta titulo="Enlace vencido" subtitulo="El enlace ya no es válido. Pide uno nuevo.">
        <Boton asChild ancho="completo">
          <Link to="/recuperar">Pedir un enlace nuevo</Link>
        </Boton>
      </PantallaCuenta>
    )
  }
  return (
    <PantallaCuenta titulo="Nueva contraseña">
      <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
        <CampoContrasena etiqueta="Contraseña nueva" autoComplete="new-password" error={errors.contrasena?.message} registro={register('contrasena')} />
        <CampoContrasena etiqueta="Repite la contraseña" autoComplete="new-password" error={errors.repetir?.message} registro={register('repetir')} />
        {errorGeneral && (
          <p role="alert" className="text-sm font-medium text-texto-marca">
            {errorGeneral}
          </p>
        )}
        <Boton type="submit" ancho="completo" disabled={isSubmitting}>
          Guardar contraseña
        </Boton>
      </form>
    </PantallaCuenta>
  )
}
