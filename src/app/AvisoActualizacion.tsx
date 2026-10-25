import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Registra el service worker (modo offline) y avisa, sin interrumpir, cuando hay una versión nueva. */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayNueva],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!hayNueva) return
    toast('Hay una versión nueva de Kaibu', {
      duration: Infinity,
      action: { label: 'Actualizar', onClick: () => void updateServiceWorker(true) },
    })
  }, [hayNueva, updateServiceWorker])

  return null
}
