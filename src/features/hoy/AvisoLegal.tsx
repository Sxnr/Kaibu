import { FileText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { registrarConsentimientos } from '@/app/consentimiento'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useConsentimientos } from '@/data/consultas'
import { documentosCambiados, VERSION_DATOS_SALUD, VERSION_TERMINOS, VERSIONES_VIGENTES } from '@/domain/legal'

const ENLACES = {
  terminos: [{ a: '/legal/terminos', texto: 'Términos y Condiciones' }],
  datos_salud: [
    { a: '/legal/privacidad', texto: 'Política de Privacidad' },
    { a: '/legal/salud', texto: 'Aviso de salud' },
  ],
}

/** RF-48 · Si cambió un documento que la persona aceptó, se le avisa en Hoy (sin bloquear la app). */
export function AvisoLegal({ userId }: { userId: string }) {
  const consentimientos = useConsentimientos(userId)
  const [aceptando, setAceptando] = useState(false)
  if (!consentimientos) return null
  const cambiados = documentosCambiados(consentimientos, VERSIONES_VIGENTES)
  if (cambiados.length === 0) return null

  const aceptar = async () => {
    setAceptando(true)
    await registrarConsentimientos(userId, { terminos: VERSION_TERMINOS, datos_salud: VERSION_DATOS_SALUD })
    toast('Gracias, aceptaste los documentos actualizados')
  }

  return (
    <Tarjeta className="flex flex-col gap-3 border-borde-control" role="region" aria-labelledby="titulo-aviso-legal">
      <h2 id="titulo-aviso-legal" className="flex items-center gap-2 font-semibold">
        <FileText className="size-5 text-texto-marca" aria-hidden /> Actualizamos nuestros documentos
      </h2>
      <p className="text-sm text-texto-secundario">Revisa los cambios. Puedes seguir usando Kaibu mientras tanto.</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {cambiados.flatMap((tipo) => ENLACES[tipo]).map((e) => (
          <li key={e.a}>
            <Link to={e.a} className="font-semibold text-texto-marca underline underline-offset-2">
              {e.texto}
            </Link>
          </li>
        ))}
      </ul>
      <Boton tamano="sm" className="self-start" disabled={aceptando} onClick={() => void aceptar()}>
        Acepto los cambios
      </Boton>
    </Tarjeta>
  )
}
