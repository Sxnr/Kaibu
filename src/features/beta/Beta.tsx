import { Link, useNavigate, useSearchParams } from 'react-router'
import { bienvenidaVista } from '@/app/bienvenida'
import { INVITACION_DISCORD } from '@/features/comunidad/discord'
import { PantallaCuenta } from '@/features/cuenta/PantallaCuenta'
import { FormularioCodigo } from './FormularioCodigo'
import { guardarCodigoPendiente, validarCodigo } from './estadoBeta'

/** /beta: entrar con el código personal (llega por mensaje del bot con el link ?codigo=XXXX). */
export default function Beta() {
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const inicial = params.get('codigo') ?? ''

  const continuar = (codigo: string) => {
    guardarCodigoPendiente(codigo)
    navegar(bienvenidaVista() ? '/registro' : '/bienvenida')
  }

  return (
    <PantallaCuenta titulo="Beta privada" subtitulo="Kaibu está en beta: por ahora solo entran quienes tienen un código personal.">
      <FormularioCodigo inicial={inicial} revisar={validarCodigo} alAceptar={continuar} textoBoton="Continuar y crear mi cuenta" />
      <ul className="flex flex-col gap-2 text-sm text-texto-secundario">
        <li>
          ¿Ya creaste tu cuenta?{' '}
          <Link to="/entrar" className="font-medium text-texto-marca underline underline-offset-2">
            Inicia sesión
          </Link>
        </li>
        <li>
          ¿No tienes código?{' '}
          {INVITACION_DISCORD ? (
            <a href={INVITACION_DISCORD} target="_blank" rel="noreferrer" className="font-medium text-texto-marca underline underline-offset-2">
              Postula en el Discord de Kaibu
            </a>
          ) : null}
          {INVITACION_DISCORD ? ' o ' : ''}
          <Link to="/#lista-espera" className="font-medium text-texto-marca underline underline-offset-2">
            únete a la lista de espera
          </Link>
          .
        </li>
      </ul>
    </PantallaCuenta>
  )
}
