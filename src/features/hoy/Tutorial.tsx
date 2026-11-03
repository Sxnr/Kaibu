import { ChartLine, Droplet, Plus, Settings, type LucideIcon } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { marcarTutorialVisto } from './tutorialEstado'

const PASOS: { icono: LucideIcon; titulo: string; texto: string }[] = [
  {
    icono: Plus,
    titulo: 'Anota lo que comes',
    texto: 'Toca + en cada comida. Busca entre miles de alimentos chilenos y con marca, o usa "Agregar rápido" si solo sabes las kcal.',
  },
  {
    icono: Droplet,
    titulo: 'Agua y nota del día',
    texto: 'Más abajo en Hoy sumas vasos de agua con un toque y escribes cómo te sentiste o entrenaste.',
  },
  {
    icono: ChartLine,
    titulo: 'Tu semana en Progreso',
    texto: 'Registra tu peso en ayunas y mira cuántos días cumpliste tus kcal y tu proteína. Desde ahí puedes compartir tu semana.',
  },
  {
    icono: Settings,
    titulo: 'Ajustes y tus datos',
    texto: 'Cambia el tema, el vaso y tu perfil, y descarga o borra tus datos cuando quieras. ¡A empezar!',
  },
]

/** Tutorial guiado de 4 pasos en una tarjeta inferior. No bloquea: se puede seguir usando Hoy mientras está abierto. */
export function Tutorial({ alCerrar }: { alCerrar: () => void }) {
  const [paso, setPaso] = useState(0)
  const actual = PASOS[paso]!
  const ultimo = paso === PASOS.length - 1
  const Icono = actual.icono
  const cerrar = () => {
    marcarTutorialVisto()
    alCerrar()
  }

  return (
    <m.section
      aria-label="Tutorial de Kaibu"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-3xl border border-borde bg-superficie p-5 shadow-tarjeta lg:right-8 lg:bottom-8 lg:left-auto lg:w-96"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={paso} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-superficie-elevada text-texto-marca">
              <Icono className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-texto-secundario">
                Paso {paso + 1} de {PASOS.length}
              </p>
              <h2 className="font-semibold" aria-live="polite">
                {actual.titulo}
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-texto-secundario">{actual.texto}</p>
        </m.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {PASOS.map((p, i) => (
            <span key={p.titulo} className={cn('h-2 rounded-full transition-all', i === paso ? 'w-5 bg-marca' : 'w-2 bg-borde')} />
          ))}
        </div>
        <div className="flex gap-2">
          {!ultimo && (
            <Boton variante="fantasma" tamano="sm" onClick={cerrar}>
              Saltar
            </Boton>
          )}
          <Boton tamano="sm" onClick={ultimo ? cerrar : () => setPaso((p) => p + 1)}>
            {ultimo ? 'Listo' : 'Siguiente'}
          </Boton>
        </div>
      </div>
    </m.section>
  )
}
