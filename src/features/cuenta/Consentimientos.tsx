import { Link } from 'react-router'
import { Casilla } from '@/components/ui/checkbox'

interface Props {
  terminos: boolean
  salud: boolean
  alCambiarTerminos: (v: boolean) => void
  alCambiarSalud: (v: boolean) => void
  error?: string
}

/** Casillas SEPARADAS y sin marcar: Términos y consentimiento para datos de salud. */
export function CasillasConsentimiento({ terminos, salud, alCambiarTerminos, alCambiarSalud, error }: Props) {
  return (
    <fieldset className="flex flex-col gap-4" aria-describedby={error ? 'error-consentimiento' : undefined}>
      <legend className="sr-only">Consentimientos</legend>
      <div className="flex items-start gap-3">
        <Casilla id="acepto-terminos" checked={terminos} onCheckedChange={(v) => alCambiarTerminos(v === true)} className="mt-0.5" aria-invalid={!!error && !terminos} />
        <label htmlFor="acepto-terminos" className="text-sm leading-relaxed">
          Acepto los{' '}
          <Link to="/legal/terminos" target="_blank" className="font-semibold text-texto-marca underline underline-offset-2">
            Términos y Condiciones
          </Link>
          .
        </label>
      </div>
      <div className="flex items-start gap-3">
        <Casilla id="acepto-salud" checked={salud} onCheckedChange={(v) => alCambiarSalud(v === true)} className="mt-0.5" aria-invalid={!!error && !salud} />
        <label htmlFor="acepto-salud" className="text-sm leading-relaxed">
          Doy mi consentimiento para que Kaibu trate mis datos de salud (peso, alimentación y fotos) con el fin de calcular y
          mostrar mi progreso, según la{' '}
          <Link to="/legal/privacidad" target="_blank" className="font-semibold text-texto-marca underline underline-offset-2">
            Política de Privacidad
          </Link>
          .
        </label>
      </div>
      {error && (
        <p id="error-consentimiento" role="alert" className="text-sm font-medium text-texto-marca">
          {error}
        </p>
      )}
    </fieldset>
  )
}
