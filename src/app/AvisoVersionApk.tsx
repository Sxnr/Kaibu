// En la app de Android la web va adentro: cuando hay una versión más nueva en la web, se avisa (sin interrumpir)
// con un botón para descargar el APK nuevo. Una vez por versión y por sesión.
import { useEffect } from 'react'
import { toast } from 'sonner'
import { esMasNueva } from '@/domain/app/version'
import { URL_WEB } from './nativo'

const CLAVE = 'kaibu:aviso-apk'

export function AvisoVersionApk() {
  useEffect(() => {
    let vivo = true
    fetch(`${URL_WEB}/novedades.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ version?: string }>) : null))
      .then((datos) => {
        const remota = datos?.version
        if (!vivo || !remota || !esMasNueva(remota, __VERSION__)) return
        try {
          if (sessionStorage.getItem(CLAVE) === remota) return
          sessionStorage.setItem(CLAVE, remota)
        } catch {
          // Sin almacenamiento: se avisa igual.
        }
        toast(`Hay una versión nueva de Kaibu (${remota})`, {
          description: 'Descárgala e instálala encima: no pierdes nada.',
          duration: Infinity,
          action: {
            label: 'Descargar',
            onClick: () => void import('@capacitor/browser').then(({ Browser }) => Browser.open({ url: `${URL_WEB}/descargar/android` })),
          },
        })
      })
      .catch(() => undefined) // Sin internet: se revisa la próxima vez.
    return () => {
      vivo = false
    }
  }, [])
  return null
}
