import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logotipo } from './Logo'
import { VistaPreviaApp } from './VistaPreviaApp'

const BENEFICIOS = ['Tu plan de calorías y proteína, calculado para ti', 'Registra una comida en segundos', 'Funciona sin internet y tus datos son tuyos']

/**
 * Pantalla dividida para la web (PC): panel de marca a la izquierda y contenido a la derecha.
 * En celular y en la app se ve solo el contenido, en formato teléfono.
 */
export function MarcoDividido({ children, panel }: { children: ReactNode; panel?: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="dark relative hidden overflow-hidden bg-fondo text-texto lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,color-mix(in_srgb,var(--marca)_45%,transparent),transparent_70%),radial-gradient(50%_40%_at_90%_90%,color-mix(in_srgb,var(--marca-oscura)_80%,transparent),transparent_70%)]"
        />
        <Link to="/" className="relative self-start rounded-lg" aria-label="Kaibu, ir al inicio">
          <Logotipo />
        </Link>
        <div className="relative flex flex-col gap-10">
          {panel ?? (
            <>
              <div>
                <h2 className="font-display text-5xl leading-none font-bold uppercase xl:text-6xl">Tu progreso, por fases.</h2>
                <ul className="mt-6 flex flex-col gap-3">
                  {BENEFICIOS.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-texto-secundario">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marca text-sobre-marca">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <VistaPreviaApp compacta className="max-w-md" />
            </>
          )}
        </div>
        <p className="relative text-xs text-texto-secundario">Kaibu entrega estimaciones y no reemplaza a un profesional de la salud.</p>
      </aside>
      <div className="flex min-h-dvh flex-col">{children}</div>
    </div>
  )
}
