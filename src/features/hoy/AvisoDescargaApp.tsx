// En la web de un Android: invita a bajar la app de Kaibu. Se puede cerrar ("Ahora no" la esconde 30 días).
import { Download, X } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { esApp, sistemaDelEquipo } from '@/app/plataforma'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import { CLAVE_DESCARTE_APK, debeOfrecerApk, leerDescarteApk } from '@/domain/app/ofrecerApk'

function leerDescarte(): string | null {
  try {
    return leerDescarteApk(localStorage.getItem(CLAVE_DESCARTE_APK))
  } catch {
    return null
  }
}

export function AvisoDescargaApp({ hoy }: { hoy: string }) {
  const reducir = useReducedMotion()
  const [visible, setVisible] = useState(() =>
    debeOfrecerApk({
      sistema: sistemaDelEquipo(navigator.userAgent),
      esApp: esApp(),
      descartadaEl: leerDescarte(),
      hoy,
    }),
  )
  if (!visible) return null

  const ahoraNo = () => {
    try {
      localStorage.setItem(CLAVE_DESCARTE_APK, hoy)
    } catch {
      // Sin almacenamiento: se esconde mientras la página siga abierta.
    }
    setVisible(false)
  }

  return (
    <m.div initial={reducir ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center" role="region" aria-label="Descarga la app de Kaibu">
        <Download className="size-6 shrink-0 text-texto-marca" aria-hidden />
        <div className="flex-1">
          <h2 className="font-semibold">Descarga la app de Kaibu</h2>
          <p className="mt-0.5 text-sm text-texto-secundario">
            Abre al tiro y funciona sin internet. Al abrirla, toca <strong>"Ya tengo cuenta"</strong> y entra con tu mismo correo: tus datos aparecen solos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Boton asChild tamano="sm">
            <a href="/descargar/android">Descargar</a>
          </Boton>
          <Boton variante="fantasma" tamano="sm" onClick={ahoraNo}>
            <X aria-hidden /> Ahora no
          </Boton>
        </div>
      </Tarjeta>
    </m.div>
  )
}
