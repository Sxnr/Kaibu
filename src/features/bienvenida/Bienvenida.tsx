import { ChartLine, Clock3, ShieldCheck, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CLAVE_BIENVENIDA } from '@/app/bienvenida'
import { IconoKaibu } from '@/components/Logo'
import { MarcoDividido } from '@/components/MarcoDividido'
import { VistaPreviaApp } from '@/components/VistaPreviaApp'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Diapositiva {
  icono: LucideIcon
  titulo: string
  texto: string
}

const DIAPOSITIVAS: Diapositiva[] = [
  {
    icono: Target,
    titulo: 'Tu progreso, por fases',
    texto: 'Kaibu calcula tu plan de calorías y proteína según tu cuerpo y tu objetivo: bajar grasa, mantener o ganar músculo.',
  },
  {
    icono: Clock3,
    titulo: 'Registra en segundos',
    texto: 'Busca alimentos chilenos, repite tus recientes y favoritos, o copia lo que comiste ayer. Sin complicaciones.',
  },
  {
    icono: ChartLine,
    titulo: 'Mide lo que importa',
    texto: 'Usamos el promedio de 7 días de tu peso para mostrar tu avance real, sin que un día suelto te desanime.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Tus datos son tuyos',
    texto: 'Solo tú ves tus registros. Puedes descargarlos o borrarlos cuando quieras. Nada se comparte sin tu permiso.',
  },
]

export default function Bienvenida() {
  const navegar = useNavigate()
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)
  const actual = DIAPOSITIVAS[indice]!
  const esUltima = indice === DIAPOSITIVAS.length - 1

  const terminar = () => {
    localStorage.setItem(CLAVE_BIENVENIDA, '1')
    navegar('/registro')
  }
  const ir = (i: number) => {
    setDireccion(i > indice ? 1 : -1)
    setIndice(i)
  }

  const Icono = actual.icono
  return (
    <MarcoDividido panel={<VistaPreviaApp className="max-w-lg" />}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-2xl lg:px-12 lg:py-12">
        <div className="flex items-center justify-between">
          <IconoKaibu className="size-10 lg:invisible" titulo="Kaibu" />
          <Boton variante="fantasma" tamano="sm" onClick={terminar}>
            Saltar
          </Boton>
        </div>

        <section className="flex flex-1 flex-col justify-center" aria-roledescription="carrusel" aria-label="Bienvenida a Kaibu">
          <AnimatePresence mode="wait" custom={direccion}>
            <m.div
              key={indice}
              custom={direccion}
              initial={{ opacity: 0, x: 40 * direccion }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 * direccion }}
              transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-col items-start gap-6"
              aria-live="polite"
            >
              <m.span
                className="relative grid size-28 place-items-center rounded-[2rem] bg-marca text-sobre-marca shadow-tarjeta"
                initial={{ scale: 0.8, rotate: -6 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                aria-hidden
              >
                <Icono className="size-14" strokeWidth={1.75} />
              </m.span>
              <p className="rotulo">
                {indice + 1} de {DIAPOSITIVAS.length}
              </p>
              <h1 className="text-5xl lg:text-7xl">{actual.titulo}</h1>
              <p className="text-lg text-texto-secundario lg:max-w-xl lg:text-xl">{actual.texto}</p>
            </m.div>
          </AnimatePresence>
        </section>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex justify-center gap-2 lg:-ml-3 lg:justify-start" role="group" aria-label="Elegir pantalla">
            {DIAPOSITIVAS.map((d, i) => (
              <button
                key={d.titulo}
                type="button"
                onClick={() => ir(i)}
                className="grid size-11 place-items-center"
                aria-label={`Ir a la pantalla ${i + 1}: ${d.titulo}`}
                aria-current={i === indice ? 'step' : undefined}
              >
                <span className={cn('h-2 rounded-full transition-all', i === indice ? 'w-6 bg-marca' : 'w-2 bg-borde-control')} />
              </button>
            ))}
          </div>
          <Boton ancho="completo" className="lg:w-auto lg:min-w-48" onClick={() => (esUltima ? terminar() : ir(indice + 1))}>
            {esUltima ? 'Comenzar' : 'Siguiente'}
          </Boton>
        </div>
      </div>
    </MarcoDividido>
  )
}
