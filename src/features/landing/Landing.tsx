import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-500-italic.css'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { bienvenidaVista } from '@/app/bienvenida'
import { IconoKaibu, Logotipo } from '@/components/Logo'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PASOS, PLANES, PREGUNTAS, PRIVACIDAD, type Plan } from './contenido'
import { ListaEspera } from './ListaEspera'
import { HistoriaSisifo, PortadaSisifo } from './sisifo/HistoriaSisifo'

// Landing de la web: la historia de Sísifo en 3D (tus comidas son la roca) y luego secciones tipo afiche.

const ENLACES = [
  { a: '#como-funciona', texto: 'Cómo funciona' },
  { a: '#precios', texto: 'Precios' },
  { a: '#preguntas', texto: 'Preguntas' },
]

/** Primera vez → bienvenida; si ya la vio → registro. */
const rutaCrearCuenta = () => (bienvenidaVista() ? '/registro' : '/bienvenida')

function Encabezado() {
  return (
    // Siempre oscuro y translúcido: va sobre la escena 3D.
    <header className="dark fixed inset-x-0 top-0 z-30 border-b border-texto/10 bg-fondo/70 text-texto backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="Kaibu, inicio">
          <Logotipo />
        </Link>
        <nav aria-label="Secciones" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {ENLACES.map((e) => (
              <li key={e.a}>
                <a href={e.a} className="rounded-full px-4 py-2 text-xs font-medium tracking-[0.16em] text-texto-secundario uppercase hover:text-texto">
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Boton asChild variante="fantasma" tamano="sm" className="rounded-full max-sm:px-3">
            <Link to="/entrar">Iniciar sesión</Link>
          </Boton>
          <Boton asChild tamano="sm" className="rounded-full max-sm:px-3">
            <a href="#lista-espera">Únete a la lista</a>
          </Boton>
        </div>
      </div>
    </header>
  )
}

/** Encabezado de sección estilo afiche: rótulo + titular condensado con una parte en rojo. */
function Titulo({ id, rotulo, children, intro }: { id: string; rotulo: string; children: ReactNode; intro?: string }) {
  return (
    <>
      <p className="rotulo border-b border-borde-control/50 pb-2.5 text-texto-marca">{rotulo}</p>
      <h2 id={id} className="mt-5 font-display text-[clamp(3rem,7.4vw,7.5rem)] leading-[0.85] font-extrabold tracking-tight text-balance uppercase">
        {children}
      </h2>
      {intro && <p className="mt-5 max-w-[52ch] text-lg text-texto-secundario">{intro}</p>}
    </>
  )
}

const Acento = ({ children }: { children: ReactNode }) => <em className="text-texto-marca not-italic">{children}</em>

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-16 bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-28">
        <Titulo id="titulo-como" rotulo="Cómo funciona" intro="Kaibu calcula tu plan con fórmulas reconocidas, te deja anotar en segundos y lo ajusta según tu progreso real.">
          Tres pasos. <Acento>Cero condena.</Acento>
        </Titulo>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="grid content-start gap-2.5 border-t-2 border-texto pt-5">
              <span className="num text-6xl leading-none font-extrabold text-numero-marca" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1 font-display text-3xl leading-none font-extrabold uppercase">
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="text-texto-secundario">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function TarjetaPlan({ plan }: { plan: Plan }) {
  return (
    <li className={cn('grid gap-4 rounded-tarjeta border p-7', plan.destacado ? 'dark border-borde bg-fondo text-texto' : 'border-borde bg-superficie')}>
      <h3 className="flex items-center justify-between gap-3 font-display text-3xl leading-none font-extrabold uppercase">
        {plan.nombre}
        <span className={cn('rounded-full px-2.5 py-1.5 font-sans text-xs font-semibold tracking-[0.14em]', plan.destacado ? 'bg-marca text-sobre-marca' : 'bg-superficie-elevada')}>
          {plan.etiqueta}
        </span>
      </h3>
      <p className={cn('num leading-none font-extrabold', plan.periodo || plan.precio.startsWith('$') ? 'text-7xl' : 'text-5xl')}>
        {plan.precio} {plan.periodo && <small className="font-sans text-base font-medium text-texto-secundario">{plan.periodo}</small>}
      </p>
      <ul className="grid gap-2.5">
        {plan.puntos.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-texto-marca" strokeWidth={3} aria-hidden />
            {t}
          </li>
        ))}
      </ul>
      {plan.nota && <p className="text-sm text-texto-secundario">{plan.nota}</p>}
    </li>
  )
}

function Precios() {
  return (
    <section id="precios" aria-labelledby="titulo-precios" className="scroll-mt-16 bg-fondo">
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-28">
        <Titulo
          id="titulo-precios"
          rotulo="Precios"
          intro="El plan, el registro y el ajuste semanal no se cobran. Kaibu+ solo suma inteligencia artificial para anotar todavía más rápido."
        >
          Lo que te ayuda a llegar <Acento>es gratis.</Acento>
        </Titulo>
        <ul className="mt-14 grid items-start gap-5 md:grid-cols-3">
          {PLANES.map((p) => (
            <TarjetaPlan key={p.nombre} plan={p} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function Privacidad() {
  return (
    <section id="privacidad" aria-labelledby="titulo-privacidad" className="dark scroll-mt-16 bg-fondo text-texto">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-end lg:py-28">
        <Titulo id="titulo-privacidad" rotulo="Privacidad">
          Tus datos son tuyos.
        </Titulo>
        <ul className="flex flex-col gap-3">
          {PRIVACIDAD.map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-marca text-sobre-marca">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="titulo-preguntas" className="dark scroll-mt-16 bg-fondo text-texto">
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-28">
        <Titulo id="titulo-preguntas" rotulo="Preguntas">
          Lo que <Acento>todos</Acento> preguntan.
        </Titulo>
        <div className="mt-12 border-t border-borde">
          {PREGUNTAS.map((p) => (
            <details key={p.pregunta} className="group border-b border-borde">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-[clamp(1.4rem,2.4vw,2rem)] leading-none font-extrabold uppercase [&::-webkit-details-marker]:hidden">
                {p.pregunta}
                <span aria-hidden className="font-sans text-3xl font-normal text-texto-marca transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="mb-6 max-w-[64ch] text-texto-secundario">{p.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function PiePagina() {
  const columnas = [
    {
      titulo: 'Kaibu',
      enlaces: ENLACES.map((e) => ({ a: e.a, texto: e.texto, interno: false })),
    },
    {
      titulo: 'Cuenta',
      enlaces: [
        { a: rutaCrearCuenta(), texto: 'Crear cuenta', interno: true },
        { a: '/entrar', texto: 'Iniciar sesión', interno: true },
      ],
    },
    {
      titulo: 'Legal',
      enlaces: [
        { a: '/legal/terminos', texto: 'Términos y Condiciones', interno: true },
        { a: '/legal/privacidad', texto: 'Política de Privacidad', interno: true },
        { a: '/legal/salud', texto: 'Aviso de salud', interno: true },
      ],
    },
  ]
  const claseEnlace = 'text-sm text-white/80 hover:text-white hover:underline'
  return (
    <footer className="bg-marca-oscura text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <span className="inline-flex items-center gap-2.5">
            <IconoKaibu className="size-8" />
            <span className="font-display text-2xl font-bold tracking-[0.12em]">KAIBU</span>
          </span>
          <p className="mt-4 max-w-xs text-sm text-white/80">Llevar tus comidas no debería ser una condena.</p>
        </div>
        {columnas.map((c) => (
          <nav key={c.titulo} aria-label={`Enlaces: ${c.titulo}`}>
            <h2 className="text-sm font-semibold">{c.titulo}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {c.enlaces.map((e) => (
                <li key={e.texto}>
                  {e.interno ? (
                    <Link to={e.a} className={claseEnlace}>
                      {e.texto}
                    </Link>
                  ) : (
                    <a href={e.a} className={claseEnlace}>
                      {e.texto}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-white/80 sm:px-6">
          © {new Date().getFullYear()} Kaibu · Hecha en Chile. Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.
        </p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-fondo">
      <a href="#contenido" className="sr-only-focusable fixed top-2 left-2 z-50 rounded-xl bg-marca px-4 py-3 text-sobre-marca">
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido">
        <HistoriaSisifo portada={<PortadaSisifo rutaCrearCuenta={rutaCrearCuenta()} />} />
        <ComoFunciona />
        <Precios />
        <Privacidad />
        <Preguntas />
        <ListaEspera />
      </main>
      <PiePagina />
    </div>
  )
}
