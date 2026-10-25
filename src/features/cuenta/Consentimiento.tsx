import { useState } from 'react'
import { useNavigate } from 'react-router'
import { registrarConsentimientos } from '@/app/consentimiento'
import { useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { VERSION_SALUD, VERSION_TERMINOS } from '@/domain/legal'
import { CasillasConsentimiento } from './Consentimientos'
import { PantallaCuenta } from './PantallaCuenta'

/** Se muestra si falta el consentimiento (p. ej. primera vez con Google o documentos actualizados). */
export default function Consentimiento() {
  const userId = useUsuario()
  const navegar = useNavigate()
  const [terminos, setTerminos] = useState(false)
  const [salud, setSalud] = useState(false)
  const [error, setError] = useState<string>()
  const [guardando, setGuardando] = useState(false)

  const continuar = async () => {
    if (!terminos || !salud) {
      setError('Para usar Kaibu necesitamos ambas autorizaciones. Puedes leer los documentos antes de aceptar.')
      return
    }
    setGuardando(true)
    await registrarConsentimientos(userId, { terminos: VERSION_TERMINOS, datos_salud: VERSION_SALUD })
    navegar('/', { replace: true })
  }

  return (
    <PantallaCuenta titulo="Antes de empezar" subtitulo="Kaibu trabaja con datos de salud. Necesitamos tu autorización explícita.">
      <CasillasConsentimiento terminos={terminos} salud={salud} alCambiarTerminos={setTerminos} alCambiarSalud={setSalud} error={error} />
      <Boton ancho="completo" onClick={continuar} disabled={guardando}>
        Continuar
      </Boton>
    </PantallaCuenta>
  )
}
