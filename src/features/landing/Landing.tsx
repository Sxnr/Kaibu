import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { bienvenidaVista } from '@/app/bienvenida'
import { IconoKaibu, Logotipo } from '@/components/Logo'
import { VistaPreviaApp } from '@/components/VistaPreviaApp'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONFIANZA, FUNCIONES, PASOS, PRIVACIDAD, PRONTO } from './contenido'

// Landing de la web: presenta Kaibu y lleva a crear cuenta o a iniciar sesión.
// Estilo editorial: mucho aire, bordes finos, un solo botón rojo por bloque.

const ENLACES = [
  { a: '#funciones', texto: 'Funciones' },
  { a: '#como-funciona', texto: 'Cómo funciona' },
  { a: '#privacidad', texto: 'Privacidad' },
]

/** Primera vez → bienvenida; si ya la vio → registro. */
const rutaCrearCuenta = () => (bienvenidaVista() ? '/registro' : '/bienvenida')

function Encabezado() {
  const [conBorde, setConBorde] = useState(false)
  useEffect(() => {
    const fn = () => setConBorde(window.scrollY > 8)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-fondo/80 backdrop-blur-md transition-colors',
        conBorde ? 'border-borde' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="Kaibu, inicio">
          <Logotipo />
        </Link>
        <nav aria-label="Secciones" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {ENLACES.map((e) => (
              <li key={e.a}>
                <a href={e.a} className="rounded-lg px-3 py-2 text-sm font-medium text-texto-secundario hover:text-texto">
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Boton asChild variante="fantasma" tamano="sm">
            <Link to="/entrar">Iniciar sesión</Link>
          </Boton>
          <Boton asChild tamano="sm" className="max-sm:hidden">
            <Link to={rutaCrearCuenta()}>Crear cuenta</Link>
          </Boton>
        </div>
      </div>
    </header>
  )
}

function Portada() {
  return (
    <section aria-labelledby="titulo-portada" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_80%_40%,color-mix(in_srgb,var(--marca)_22%,transparent),transparent_70%),radial-gradient(35%_40%_at_5%_0%,color-mix(in_srgb,var(--marca-oscura)_18%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <div className="flex flex-col items-start gap-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-1.5 text-sm font-medium">
            <span className="size-2 rounded-full bg-marca" aria-hidden />
            Nutrición y progreso · Hecha en Chile
          </p>
          <h1 id="titulo-portada" className="text-6xl sm:text-7xl xl:text-8xl">
            Tu progreso, <span className="text-numero-marca">por fases.</span>
          </h1>
          <p className="max-w-xl text-lg text-texto-secundario sm:text-xl">
            Kaibu calcula tu plan de calorías y proteína según tu cuerpo y tu objetivo, y te muestra tu avance real. Registrar una comida
            toma segundos.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Boton asChild className="sm:min-w-52">
              <Link to={rutaCrearCuenta()}>
                Empezar gratis <ArrowRight aria-hidden />
              </Link>
            </Boton>
            <Boton asChild variante="contorno">
              <Link to="/entrar">Ya tengo cuenta</Link>
            </Boton>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-texto-secundario">
            {['Gratis', 'Sin publicidad', 'Web y Android'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-exito" strokeWidth={3} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <VistaPreviaApp className="mx-auto w-full max-w-lg lg:max-w-none" />
      </div>
    </section>
  )
}

function Confianza() {
  return (
    <section aria-label="Por qué Kaibu" className="border-y border-borde bg-superficie">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
        {CONFIANZA.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className={cn('flex items-center gap-3 border-borde px-4 py-6 sm:px-6', i % 2 === 1 && 'border-l', i >= 2 && 'max-lg:border-t lg:border-l')}
          >
            <Icono className="size-6 shrink-0 text-texto-marca" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{titulo}</span>
              <span className="block text-sm text-texto-secundario">{texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Funciones() {
  return (
    <section id="funciones" aria-labelledby="titulo-funciones" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-2xl">
        <p className="rotulo">Funciones</p>
        <h2 id="titulo-funciones" className="mt-2 font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
          Lo necesario, sin nada que sobre
        </h2>
        <p className="mt-4 text-lg text-texto-secundario">Pensada para que anotar lo que comes no se convierta en otra tarea pesada del día.</p>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="rounded-tarjeta border border-borde bg-superficie p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-superficie-elevada text-texto-marca">
              <Icono className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>
            <p className="mt-2 text-texto-secundario">{texto}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-texto-marca" aria-hidden /> Pronto:
        </span>
        {PRONTO.map((p) => (
          <span key={p} className="rounded-full border border-borde px-3 py-1.5 text-sm text-texto-secundario">
            {p}
          </span>
        ))}
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 border-t border-borde bg-superficie">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <p className="rotulo">Cómo funciona</p>
        <h2 id="titulo-como" className="mt-2 font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
          Tres pasos y listo
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="border-t-2 border-marca pt-6">
              <span className="num text-6xl leading-none font-bold text-numero-marca" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl font-semibold">
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="mt-2 text-texto-secundario">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Privacidad() {
  return (
    <section id="privacidad" aria-labelledby="titulo-privacidad" className="dark relative scroll-mt-20 overflow-hidden bg-fondo text-texto">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_0%_100%,color-mix(in_srgb,var(--marca-oscura)_90%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="rotulo">Privacidad</p>
          <h2 id="titulo-privacidad" className="mt-2 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
            Tus datos son tuyos.
          </h2>
          <p className="mt-6 max-w-md text-lg text-texto-secundario">
            Tu peso y tu alimentación son datos de salud. Los tratamos con el cuidado que exige la ley chilena de protección de datos.
          </p>
        </div>
        <ul className="flex flex-col gap-4 self-center">
          {PRIVACIDAD.map((t) => (
            <li key={t} className="flex gap-4 rounded-tarjeta border border-borde bg-superficie p-5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-marca text-sobre-marca">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LlamadoFinal() {
  return (
    <section aria-labelledby="titulo-final" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="flex flex-col items-start gap-8 rounded-tarjeta border border-borde bg-superficie p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <IconoKaibu className="size-16 shrink-0" />
          <div>
            <h2 id="titulo-final" className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
              Empieza hoy tu primera fase
            </h2>
            <p className="mt-2 text-texto-secundario">Gratis. Tu plan listo en menos de 2 minutos.</p>
          </div>
        </div>
        <Boton asChild className="w-full lg:w-auto lg:min-w-52">
          <Link to={rutaCrearCuenta()}>
            Crear mi cuenta <ArrowRight aria-hidden />
          </Link>
        </Boton>
      </div>
    </section>
  )
}

function PiePagina() {
  const columnas = [
    {
      titulo: 'Kaibu',
      enlaces: [
        { a: '#funciones', texto: 'Funciones', interno: false },
        { a: '#como-funciona', texto: 'Cómo funciona', interno: false },
        { a: '#privacidad', texto: 'Privacidad', interno: false },
      ],
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
          <p className="mt-4 max-w-xs text-sm text-white/80">Nutrición y progreso, por fases.</p>
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
        <Portada />
        <Confianza />
        <Funciones />
        <ComoFunciona />
        <Privacidad />
        <LlamadoFinal />
      </main>
      <PiePagina />
    </div>
  )
}
