import { Eye, EyeOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Campo, Entrada } from '@/components/ui/campo'

interface Props {
  etiqueta: string
  error?: string
  ayuda?: ReactNode
  autoComplete: 'new-password' | 'current-password'
  registro: UseFormRegisterReturn
}

/** Contraseña con botón para mostrar u ocultar. */
export function CampoContrasena({ etiqueta, error, ayuda, autoComplete, registro }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(a) => (
        <div className="relative">
          <Entrada type={visible ? 'text' : 'password'} autoComplete={autoComplete} className="pr-14" {...a} {...registro} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-texto-secundario hover:text-texto"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      )}
    </Campo>
  )
}
