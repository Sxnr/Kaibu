import { useState } from 'react'
import { toast } from 'sonner'
import { Casilla } from '@/components/ui/checkbox'
import { guardarPreferencias, type PreferenciasDiscord as Preferencias } from './discord'

const OPCIONES: { clave: keyof Preferencias; texto: string; detalle: string }[] = [
  { clave: 'recordatorio', texto: 'Recordarme a las 21:00 si no anoté nada', detalle: 'Un mensaje privado del bot de Kaibu, como máximo uno al día.' },
  { clave: 'celebrarRachas', texto: 'Celebrar mis rachas en #progreso', detalle: 'Cuando llegues a 7 o 30 días seguidos, el bot lo anuncia con tu nombre.' },
  { clave: 'avisosDm', texto: 'Avisarme cuando respondan mis ideas', detalle: 'Un mensaje privado cuando tu reporte o sugerencia cambie de estado.' },
]

/** Preferencias de la comunidad (solo con el Discord vinculado). Se guardan al tocar. */
export function PreferenciasDiscord({ inicial }: { inicial: Preferencias }) {
  const [valores, setValores] = useState(inicial)

  const cambiar = async (clave: keyof Preferencias, valor: boolean) => {
    const anterior = valores
    const nuevo = { ...valores, [clave]: valor }
    setValores(nuevo)
    try {
      await guardarPreferencias(nuevo)
    } catch {
      setValores(anterior)
      toast.error('No pudimos guardar el cambio. Revisa tu conexión e intenta de nuevo.')
    }
  }

  return (
    <fieldset className="mt-4 border-t border-borde pt-4">
      <legend className="sr-only">Preferencias de la comunidad</legend>
      <p className="text-sm font-semibold">Tus preferencias</p>
      <ul className="mt-2 flex flex-col gap-3">
        {OPCIONES.map((o) => (
          <li key={o.clave} className="flex items-start gap-3">
            <Casilla id={`pref-${o.clave}`} className="mt-0.5" checked={valores[o.clave]} onCheckedChange={(v) => void cambiar(o.clave, v === true)} />
            <label htmlFor={`pref-${o.clave}`} className="text-sm">
              <span className="block font-medium">{o.texto}</span>
              <span className="block text-texto-secundario">{o.detalle}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
