import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { codigoConFormato, normalizarCodigo } from '@/domain/beta/codigo'

interface Props {
  inicial?: string
  /** Revisa el código (validar antes de crear la cuenta, o canjear con la cuenta). true = sirve. */
  revisar: (codigo: string) => Promise<boolean>
  alAceptar: (codigo: string) => void
  textoBoton: string
}

/** Campo del código de beta (8 caracteres) con errores claros. */
export function FormularioCodigo({ inicial = '', revisar, alAceptar, textoBoton }: Props) {
  const [codigo, setCodigo] = useState(inicial)
  const [error, setError] = useState<string | null>(null)
  const [revisando, setRevisando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!codigoConFormato(codigo)) {
      setError('El código tiene 8 letras o números, como K7M2QX4P. Revisa el mensaje que te llegó.')
      return
    }
    setRevisando(true)
    try {
      const sirve = await revisar(codigo)
      if (sirve) alAceptar(normalizarCodigo(codigo))
      else setError('Ese código no existe o ya se usó. Si crees que es un error, escríbenos en el Discord.')
    } catch {
      setError('No pudimos revisar el código. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setRevisando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo etiqueta="Código de beta" error={error ?? undefined} ayuda="Te llegó por mensaje del bot de Kaibu en Discord, o te lo dio el equipo.">
        {(a) => (
          <Entrada
            {...a}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            className="num text-center text-2xl tracking-[0.3em] uppercase"
          />
        )}
      </Campo>
      <Boton type="submit" ancho="completo" disabled={revisando}>
        <KeyRound aria-hidden /> {revisando ? 'Revisando…' : textoBoton}
      </Boton>
    </form>
  )
}
