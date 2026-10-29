import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { bienvenidaVista } from '@/app/bienvenida'
import { IconoKaibu, Logotipo } from '@/components/Logo'
import { TarjetaPeso, VistaPreviaApp } from '@/components/VistaPreviaApp'
import { Boton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BLOQUES, CONFIANZA, FUNCIONES, PASOS, PRIVACIDAD, PRONTO, type Bloque } from './contenido'
import { FOTO_PORTADA } from './fotos'
import { MaquetaAgregar, MaquetaPlan } from './Maquetas'
import { ListaEspera } from './ListaEspera'

// Landing de la web, inspirada en tres guías de estilo:
// - Superhuman: ritmo editorial, foto de portada con tarjetas de vidrio, banda oscura, pie vino.
// - Mercury: barra transparente que se vuelve vidrio, botones píldora, un solo color de acción.
// - Notion: palabra del titular en una píldora y bloques con paneles de color tipo "post-it".

const ENLACES = [
  { a: '#funciones', texto: 'Funciones' },
  { a: '#como-funciona', texto: 'Cómo funciona' },
  { a: '#privacidad', texto: 'Privacidad' },
]

/** Primera vez → bienvenida; si ya la vio → registro. */
const rutaCrearCuenta = () => (bienvenidaVista() ? '/registro' : '/bienvenida')

const pildora = 'rounded-full'

function Encabezado() {
  const [bajo, setBajo] = useState(false)
  useEffect(() => {
    const fn = () => setBajo(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    // Sobre la foto va transparente (texto claro); al bajar se vuelve vidrio con el tema de la app.
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 border-b transition-[background-color,border-color] duration-300',
        bajo ? 'border-borde bg-fondo/85 backdrop-blur-md' : 'dark border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 text-texto sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="Kaibu, inicio">
          <Logotipo />
        </Link>
        <nav aria-label="Secciones" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {ENLACES.map((e) => (
              <li key={e.a}>
                <a href={e.a} className="rounded-full px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto">
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Boton asChild variante="fantasma" tamano="sm" className={pildora}>
            <Link to="/entrar">Iniciar sesión</Link>
          </Boton>
          <Boton asChild tamano="sm" className={cn(pildora, 'max-sm:hidden')}>
            <Link to={rutaCrearCuenta()}>Crear cuenta</Link>
          </Boton>
        </div>
      </div>
    </header>
  )
}

function FondoPortada() {
  if (FOTO_PORTADA) {
    return (
      <>
        <img
          src={FOTO_PORTADA.src}
          srcSet={FOTO_PORTADA.srcSet}
          sizes="100vw"
          alt=""
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
        {/* Velo para que el texto se lea siempre sobre la foto */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
      </>
    )
  }
  // Sin foto: atmósfera de marca (brillos carmesí y ámbar sobre negro cálido).
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-fondo bg-[radial-gradient(55%_60%_at_85%_30%,color-mix(in_srgb,var(--marca)_55%,transparent),transparent_70%),radial-gradient(40%_45%_at_60%_100%,color-mix(in_srgb,var(--panel-ambar)_28%,transparent),transparent_70%),radial-gradient(45%_50%_at_0%_0%,color-mix(in_srgb,var(--marca-oscura)_70%,transparent),transparent_70%)]"
    />
  )
}

function Portada() {
  return (
    <section aria-labelledby="titulo-portada" className="dark relative isolate overflow-hidden text-texto">
      <FondoPortada />
      <div className="relative mx-auto grid min-h-[92dvh] max-w-6xl items-center gap-12 px-4 pt-28 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="flex flex-col items-start gap-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium backdrop-blur">
            <span className="size-2 rounded-full bg-marca-intensa" aria-hidden />
            Nutrición y progreso · Hecha en Chile
          </p>
          <h1 id="titulo-portada" className="titular text-5xl sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            Tu progreso,{' '}
            <span className="mt-1 inline-block rounded-full bg-marca px-[0.38em] pb-[0.1em] text-white">por fases.</span>
          </h1>
          <p className="max-w-lg text-lg text-texto-secundario sm:text-xl">
            Kaibu calcula tu plan de calorías y proteína según tu cuerpo y tu objetivo, y te muestra tu avance real. Registrar una comida toma
            segundos.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Boton asChild className={cn(pildora, 'px-7 sm:min-w-52')}>
              <Link to={rutaCrearCuenta()}>
                Empezar gratis <ArrowRight aria-hidden />
              </Link>
            </Boton>
            <Boton asChild variante="contorno" className={cn(pildora, 'px-7')}>
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
        {/* Tarjetas de vidrio claras flotando sobre la portada (Superhuman) */}
        <div className="tema-claro">
          <VistaPreviaApp className="mx-auto w-full max-w-lg lg:max-w-none" />
        </div>
      </div>
      {FOTO_PORTADA && (
        <p className="absolute right-4 bottom-3 text-xs text-white/80">
          Foto:{' '}
          <a href={FOTO_PORTADA.enlace} className="underline underline-offset-2 hover:text-white" rel="noreferrer" target="_blank">
            {FOTO_PORTADA.autor} en Unsplash
          </a>
        </p>
      )}
    </section>
  )
}

function Confianza() {
  return (
    <section aria-label="Por qué Kaibu" className="border-b border-borde bg-superficie">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
        {CONFIANZA.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className={cn('flex items-center gap-3 border-borde px-4 py-7 sm:px-6', i % 2 === 1 && 'border-l', i >= 2 && 'max-lg:border-t lg:border-l')}
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

const PANEL: Record<Bloque['id'], { color: string; maqueta: ReactNode; etiqueta: string }> = {
  agregar: { color: 'bg-panel-ambar', maqueta: <MaquetaAgregar className="w-full max-w-sm" />, etiqueta: 'Pantalla para agregar alimentos' },
  plan: { color: 'bg-panel-cielo', maqueta: <MaquetaPlan className="w-full max-w-sm" />, etiqueta: 'Pantalla de tu plan con meta y macros' },
  progreso: { color: 'bg-panel-verde', maqueta: <TarjetaPeso className="w-full max-w-sm bg-superficie" />, etiqueta: 'Gráfico de peso con promedio de 7 días' },
}

function BloqueFuncion({ bloque, invertido }: { bloque: Bloque; invertido: boolean }) {
  const panel = PANEL[bloque.id]
  return (
    <li className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={cn('max-w-lg', invertido && 'lg:order-2')}>
        <p className="rotulo">{bloque.rotulo}</p>
        <h3 className="titular mt-3 text-3xl sm:text-4xl">{bloque.titulo}</h3>
        <p className="mt-4 text-lg text-texto-secundario">{bloque.texto}</p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {bloque.puntos.map((p) => (
            <li key={p} className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-texto-marca" strokeWidth={3} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </div>
      {/* Panel de color tipo "post-it" (Notion) con la pantalla de la app dentro */}
      <div
        role="img"
        aria-label={`${panel.etiqueta} (ejemplo)`}
        className={cn('tema-claro grid min-h-80 place-items-center rounded-tarjeta p-6 sm:p-10', panel.color)}
      >
        <div aria-hidden className="w-full max-w-sm">
          {panel.maqueta}
        </div>
      </div>
    </li>
  )
}

function Funciones() {
  return (
    <section id="funciones" aria-labelledby="titulo-funciones" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 lg:py-32">
      <div className="max-w-2xl">
        <p className="rotulo">Funciones</p>
        <h2 id="titulo-funciones" className="titular mt-3 text-4xl sm:text-5xl lg:text-6xl">
          Lo necesario, sin nada que sobre.
        </h2>
        <p className="mt-5 text-lg text-texto-secundario">Pensada para que anotar lo que comes no se convierta en otra tarea pesada del día.</p>
      </div>
      <ul className="mt-16 flex flex-col gap-20 lg:gap-28">
        {BLOQUES.map((b, i) => (
          <BloqueFuncion key={b.id} bloque={b} invertido={i % 2 === 1} />
        ))}
      </ul>
      <ul className="mt-24 grid gap-4 md:grid-cols-3">
        {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="rounded-tarjeta border border-borde bg-superficie p-6">
            <Icono className="size-6 text-texto-marca" aria-hidden />
            <h3 className="mt-4 font-semibold">{titulo}</h3>
            <p className="mt-1.5 text-texto-secundario">{texto}</p>
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
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 border-y border-borde bg-superficie">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <p className="rotulo">Cómo funciona</p>
        <h2 id="titulo-como" className="titular mt-3 text-4xl sm:text-5xl lg:text-6xl">
          Tres pasos y listo.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-10">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="border-t border-borde-control pt-6">
              <span className="num text-5xl leading-none font-bold text-numero-marca" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="titular mt-5 text-2xl">
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

/** Composición geométrica translúcida (en vez de foto), como la banda oscura de Superhuman. */
function ArteGeometrico() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute top-[8%] left-[6%] h-[58%] w-[52%] -rotate-6 rounded-3xl bg-marca/55" />
      <div className="absolute top-[22%] right-[4%] h-[48%] w-[46%] rotate-6 rounded-3xl bg-panel-ambar/40" />
      <div className="absolute bottom-[6%] left-[22%] h-[42%] w-[50%] rotate-3 rounded-3xl bg-panel-cielo/35" />
      <div className="tema-claro absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl border border-white/30 bg-superficie/90 px-5 py-4 text-texto backdrop-blur">
        <span className="grid size-10 place-items-center rounded-xl bg-marca text-sobre-marca">
          <Lock className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Solo tú ves tus datos</span>
          <span className="block text-xs text-texto-secundario">Protegidos por usuario</span>
        </span>
      </div>
    </div>
  )
}

function Privacidad() {
  return (
    <section id="privacidad" aria-labelledby="titulo-privacidad" className="dark relative scroll-mt-20 overflow-hidden bg-fondo text-texto">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_0%_100%,color-mix(in_srgb,var(--marca-oscura)_85%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-32">
        <ArteGeometrico />
        <div>
          <p className="rotulo">Privacidad</p>
          <h2 id="titulo-privacidad" className="titular mt-3 text-4xl sm:text-5xl lg:text-6xl">
            Tus datos son tuyos.
          </h2>
          <p className="mt-5 max-w-md text-lg text-texto-secundario">
            Tu peso y tu alimentación son datos de salud. Los tratamos con el cuidado que exige la ley chilena de protección de datos.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
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
      </div>
    </section>
  )
}

function LlamadoFinal() {
  return (
    // Banda atmosférica de brillos de color (Superhuman)
    <section aria-labelledby="titulo-final" className="relative overflow-hidden border-t border-borde">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(40%_80%_at_70%_50%,color-mix(in_srgb,var(--marca)_30%,transparent),transparent_70%),radial-gradient(35%_70%_at_95%_50%,color-mix(in_srgb,var(--panel-cielo)_30%,transparent),transparent_70%),radial-gradient(45%_60%_at_45%_100%,color-mix(in_srgb,var(--panel-ambar)_28%,transparent),transparent_70%),radial-gradient(35%_60%_at_20%_80%,color-mix(in_srgb,var(--panel-verde)_25%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-28">
        <div className="flex items-center gap-5">
          <IconoKaibu className="size-14 shrink-0" />
          <div>
            <h2 id="titulo-final" className="titular text-4xl sm:text-5xl">
              Empieza hoy tu primera fase.
            </h2>
            <p className="mt-2 text-lg text-texto-secundario">Gratis. Tu plan listo en menos de 2 minutos.</p>
          </div>
        </div>
        <Boton asChild className={cn(pildora, 'w-full px-8 lg:w-auto lg:min-w-52')}>
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
        <ListaEspera />
        <LlamadoFinal />
      </main>
      <PiePagina />
    </div>
  )
}
