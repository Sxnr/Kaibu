import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Encabezado } from '@/components/Encabezado'
import { Tarjeta } from '@/components/ui/tarjeta'
import { fechaCompleta } from '@/domain/format/formato'
import { CAMBIOS, CLAVE_VERSION_VISTA, EN_CAMINO, versionLegible } from './cambios'

/** Apartado de cambios: qué trae cada versión y qué viene. */
export default function Novedades() {
  // Abrir Novedades cuenta como haberlas visto.
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_VERSION_VISTA, __VERSION__)
    } catch {
      // Sin almacenamiento: no pasa nada, solo se volverá a avisar.
    }
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Novedades" antetitulo={`Estás usando Kaibu ${versionLegible(__VERSION__)}`} />
      {CAMBIOS.map((v, i) => (
        <Tarjeta key={v.version}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-semibold">
              {versionLegible(v.version)} · {v.titulo}
              {i === 0 && <span className="ml-2 rounded-full bg-superficie-elevada px-2 py-0.5 text-xs font-medium text-texto-marca">Actual</span>}
            </h2>
            <p className="text-sm text-texto-secundario">{fechaCompleta(v.fecha)}</p>
          </div>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {v.cambios.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Tarjeta>
      ))}
      <Tarjeta>
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-texto-marca" aria-hidden /> En camino
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-texto-secundario">
          {EN_CAMINO.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  )
}
