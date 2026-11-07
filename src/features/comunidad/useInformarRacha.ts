// Informa la racha (RN-16) al Discord una vez al día, para los roles 🔥 7+ y ⚡ 30+.
// Si la persona no vinculó su Discord, el servidor no hace nada. Nunca molesta si falla.
import { useEffect, useRef } from 'react'
import { useSesion } from '@/app/useSesion'
import { debeInformarRacha } from '@/domain/comunidad/reportes'
import { informarRacha } from './discord'

const CLAVE = 'kaibu:racha-discord'

export function useInformarRacha(listo: boolean, hoy: string, racha: number) {
  const { modoLocal, enLinea } = useSesion()
  const enCurso = useRef<string | null>(null)

  useEffect(() => {
    if (!listo || modoLocal || !enLinea) return
    const clave = `${hoy}:${racha}`
    let anterior: string | null = null
    try {
      anterior = localStorage.getItem(CLAVE)
    } catch {
      return
    }
    if (!debeInformarRacha(anterior, hoy, racha) || enCurso.current === clave) return
    enCurso.current = clave
    informarRacha(racha)
      .then(() => {
        try {
          localStorage.setItem(CLAVE, clave)
        } catch {
          // Sin almacenamiento: se volverá a informar, sin problema.
        }
      })
      .catch(() => {
        enCurso.current = null
      })
  }, [listo, modoLocal, enLinea, hoy, racha])
}
