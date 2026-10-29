import { MailX } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { obtenerSupabase } from '@/data/supabase'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Baja de la lista de espera con el enlace del correo (no revela si el correo existía). */
export default function BajaListaEspera() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [estado, setEstado] = useState<'pregunta' | 'enviando' | 'listo' | 'error'>('pregunta')
  const valido = UUID.test(token)

  const darDeBaja = async () => {
    setEstado('enviando')
    const supabase = await obtenerSupabase()
    const { error } = supabase ? await supabase.rpc('baja_lista_espera', { token }) : { error: true }
    setEstado(error ? 'error' : 'listo')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5 py-10">
      <EstadoVacio
        icono={MailX}
        titulo={estado === 'listo' ? 'Listo, ya no te escribiremos' : 'Salir de la lista de espera'}
        texto={
          !valido
            ? 'El enlace no es válido. Ábrelo directo desde el correo que te enviamos.'
            : estado === 'listo'
              ? 'Borramos tu correo de la lista. Puedes volver a inscribirte cuando quieras.'
              : estado === 'error'
                ? 'No pudimos completar la baja. Revisa tu conexión e inténtalo de nuevo.'
                : 'Borraremos tu correo y no recibirás más mensajes de la lista.'
        }
        accion={
          valido && estado !== 'listo' ? (
            <Boton onClick={() => void darDeBaja()} disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Borrando…' : 'Darme de baja'}
            </Boton>
          ) : (
            <Boton asChild variante="secundario">
              <Link to="/">Ir al inicio</Link>
            </Boton>
          )
        }
      />
    </main>
  )
}
