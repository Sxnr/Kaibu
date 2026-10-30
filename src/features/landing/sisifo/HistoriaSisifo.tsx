import { ArrowDown, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Boton } from '@/components/ui/button'
import { formatoNumero } from '@/domain/format/formato'
import {
  avanceCapitulo,
  capituloActual,
  enReposo,
  FICHAS_COMIDA,
  kcalAnotadas,
  lerp,
  lim,
  META_KCAL,
  opacidadAjuste,
  opacidadFichas,
  opacidadHoy,
  palabrasEncendidas,
  pasoResorte,
  tramo,
  viajeFicha,
  type Resorte,
} from '@/domain/landing/guion'
import { cn } from '@/lib/utils'
import type { EscenaSisifo, Punto } from './escena'

// Historia de la landing: Sísifo empuja una roca (tus comidas) montaña arriba mientras bajas por la página.
// El 3D se carga aparte; mientras carga, sin WebGL, con "reducir movimiento" o en pruebas automáticas se ven imágenes fijas.

interface Palabra {
  texto: string
  acento?: boolean
}
const p = (texto: string, acento = false): Palabra => ({ texto, acento })

const CAPITULOS_TEXTO: { titulo: Palabra[]; bajada: string; derecha?: boolean }[] = [
  {
    titulo: [p('Cada'), p('día'), p('empujas'), p('la', true), p('misma', true), p('roca.', true)],
    bajada: 'Comes a ojo, olvidas lo que picoteaste y no sabes si vas bien. Todo lo que no anotas pesa.',
    derecha: true,
  },
  {
    titulo: [p('Anota'), p('tus'), p('comidas'), p('en'), p('segundos.', true)],
    bajada: 'Busca, toca y listo: tus recientes y favoritos a un toque, incluso sin internet. Cada comida anotada le quita peso a la roca.',
  },
  {
    titulo: [p('Kaibu'), p('ajusta'), p('tu'), p('plan'), p('cada'), p('semana.'), p('Gratis.', true)],
    bajada: 'Mira tu promedio de 7 días y te propone un cambio pequeño. Otras apps te cobran por esto.',
  },
  {
    titulo: [p('Llegas.'), p('Y', true), p('te', true), p('quedas.', true)],
    bajada: '',
    derecha: true,
  },
]

const DESCRIPCIONES = [
  'Una estatua de mármol de Sísifo empuja una roca de mármol rojo montaña arriba, al atardecer.',
  'Primer plano de las manos de Sísifo contra la roca, que lleva comidas sin anotar.',
  'Las comidas anotadas salen volando de la roca hacia el resumen del día y la roca se achica.',
  'Vista desde arriba: Sísifo sube la montaña con menos esfuerzo gracias al ajuste semanal.',
  'Sísifo llega a la cumbre, se endereza y apoya la mano en la roca sobre un mar de nubes.',
]

const imagenRespaldo = (capitulo: number) => `/landing/sisifo/respaldo-${capitulo + 1}.jpg`

type Modo = 'cargando' | '3d' | 'imagenes' | 'sin-webgl'

/** El 3D se omite en pruebas automáticas (más rápidas y estables) y si la persona pidió reducir el movimiento. */
function puede3d(): boolean {
  return !navigator.webdriver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Insignia({ nombre, refFicha }: { nombre: string; refFicha: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={refFicha}
      className="absolute top-0 left-0 grid size-24 place-content-center gap-0.5 rounded-full border-[3px] border-texto bg-fondo text-center opacity-0 shadow-[inset_0_0_0_5px_var(--fondo),inset_0_0_0_6.5px_color-mix(in_srgb,var(--texto)_45%,transparent)] will-change-transform sm:size-28"
    >
      <small className="text-[9px] font-semibold tracking-[0.18em] uppercase opacity-75" data-estado>
        sin anotar
      </small>
      <b className="font-display text-xl leading-none font-extrabold uppercase sm:text-2xl">{nombre}</b>
      <span className="num text-xl leading-none font-extrabold text-texto-marca sm:text-2xl" data-kcal>
        ¿?
      </span>
    </div>
  )
}

function Tarjeta({ refTarjeta, children }: { refTarjeta: (el: HTMLDivElement | null) => void; children: ReactNode }) {
  return (
    <div
      ref={refTarjeta}
      className="absolute right-4 bottom-5 grid w-[min(300px,calc(100%-2rem))] gap-2 rounded-tarjeta border border-texto/15 bg-fondo/60 px-5 py-4 opacity-0 backdrop-blur-xl will-change-transform sm:right-7 sm:bottom-8"
    >
      {children}
    </div>
  )
}

export function HistoriaSisifo({ portada }: { portada: ReactNode }) {
  const seccion = useRef<HTMLElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const fichas = useRef<(HTMLDivElement | null)[]>([])
  const hoy = useRef<HTMLDivElement | null>(null)
  const hoyNum = useRef<HTMLSpanElement>(null)
  const hoyBarra = useRef<HTMLElement>(null)
  const ajuste = useRef<HTMLDivElement | null>(null)
  const [modo, setModo] = useState<Modo>('cargando')
  const [capitulo, setCapitulo] = useState(0)

  useEffect(() => {
    const raiz = seccion.current
    const canvas = lienzo.current
    if (!raiz || !canvas) return
    let escena: EscenaSisifo | null = null
    let cancelado = false
    let cuadro = 0
    let previo = 0
    const avance = () => {
      const r = raiz.getBoundingClientRect()
      return lim(-r.top / Math.max(1, r.height - window.innerHeight))
    }
    let resorte: Resorte = { p: avance(), v: 0 }

    // Las palabras de cada título se encienden al llegar a su capítulo.
    const textos = () => {
      for (const c of raiz.querySelectorAll<HTMLElement>('[data-capitulo]')) {
        const palabras = c.querySelectorAll<HTMLElement>('[data-palabra]')
        const n = palabrasEncendidas(avanceCapitulo(c.getBoundingClientRect().top, window.innerHeight), palabras.length)
        palabras.forEach((el, i) => el.toggleAttribute('data-on', i < n))
      }
    }

    // Fichas de comida (siguen la roca y vuelan al resumen) y tarjetas "Hoy" y "Ajuste".
    const capas = (avanceP: number, origenes: Punto[] | null) => {
      const caja = canvas.getBoundingClientRect()
      const rHoy = hoy.current?.getBoundingClientRect()
      const destino = rHoy ? { x: rHoy.left - caja.left + 60, y: rHoy.top - caja.top + 30 } : { x: 0, y: 0 }
      const visibles = opacidadFichas(avanceP)
      FICHAS_COMIDA.forEach((f, i) => {
        const el = fichas.current[i]
        const o = origenes?.[i]
        if (!el) return
        if (!o) {
          el.style.opacity = '0'
          return
        }
        const t = viajeFicha(i, avanceP)
        const x = lerp(o.x, destino.x, t)
        const y = lerp(o.y, destino.y, t) - Math.sin(Math.PI * t) * 90
        const medio = el.offsetWidth / 2
        el.style.transform = `translate3d(${(x - medio).toFixed(1)}px, ${(y - medio).toFixed(1)}px, 0) rotate(${(f.angulo * 9 - 10).toFixed(1)}deg) scale(${(1 - 0.35 * t).toFixed(3)})`
        el.style.opacity = (visibles * (1 - tramo(t, 0.85, 1))).toFixed(3)
        const anotado = t > 0.02
        const estado = el.querySelector('[data-estado]')
        const kcal = el.querySelector('[data-kcal]')
        if (estado) estado.textContent = anotado ? 'anotado' : 'sin anotar'
        if (kcal) kcal.textContent = anotado ? `${formatoNumero(f.kcal)} kcal` : '¿?'
      })
      const total = kcalAnotadas(avanceP)
      if (hoyNum.current) hoyNum.current.textContent = formatoNumero(total)
      if (hoyBarra.current) hoyBarra.current.style.width = `${((total / META_KCAL) * 100).toFixed(1)}%`
      for (const [el, o] of [
        [hoy.current, opacidadHoy(avanceP)],
        [ajuste.current, opacidadAjuste(avanceP)],
      ] as const) {
        if (!el) continue
        el.style.opacity = o.toFixed(3)
        el.style.transform = `translate3d(0, ${((1 - o) * 12).toFixed(1)}px, 0)`
      }
    }

    const pintar = (avanceP: number) => {
      capas(avanceP, escena ? escena.dibujar(avanceP) : null)
      setCapitulo(capituloActual(avanceP))
    }

    // Resorte sin rebote: la escena sigue al scroll con suavidad y solo se dibuja mientras se mueve.
    const paso = (ahora: number) => {
      const objetivo = avance()
      resorte = pasoResorte(resorte, objetivo, Math.min(1 / 30, Math.max(0.001, (ahora - previo) / 1000)))
      previo = ahora
      if (enReposo(resorte, objetivo)) resorte = { p: objetivo, v: 0 }
      pintar(resorte.p)
      cuadro = resorte.v === 0 ? 0 : requestAnimationFrame(paso)
    }
    const alDesplazar = () => {
      textos()
      if (!escena) {
        resorte = { p: avance(), v: 0 }
        pintar(resorte.p)
      } else if (!cuadro) {
        previo = performance.now()
        cuadro = requestAnimationFrame(paso)
      }
    }
    const alCambiarTamano = () => {
      escena?.ajustar()
      pintar(resorte.p)
      textos()
    }

    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alCambiarTamano)
    textos()
    pintar(resorte.p)

    if (!puede3d()) setModo('imagenes')
    else {
      const celular = Math.min(window.innerWidth, window.innerHeight) < 700
      import('./escena')
        .then(({ crearEscena }) => crearEscena(canvas, { celular }))
        .then((e) => {
          if (cancelado) return e.destruir()
          escena = e
          setModo('3d')
          pintar(resorte.p)
        })
        .catch(() => {
          if (!cancelado) setModo('sin-webgl')
        })
    }

    return () => {
      cancelado = true
      cancelAnimationFrame(cuadro)
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alCambiarTamano)
      escena?.destruir()
    }
  }, [])

  const con3d = modo === '3d'
  return (
    <section ref={seccion} id="historia" aria-label="La historia de Sísifo y tus comidas" className="dark relative bg-escenario text-texto">
      <div className="sticky top-0 h-svh overflow-hidden bg-escenario">
        <canvas
          ref={lienzo}
          aria-hidden
          className={cn('absolute inset-0 block size-full transition-opacity duration-500', con3d ? 'opacity-100' : 'opacity-0')}
        />
        {con3d ? (
          <p className="sr-only">{DESCRIPCIONES[capitulo]}</p>
        ) : (
          <img
            src={imagenRespaldo(capitulo)}
            alt={DESCRIPCIONES[capitulo]}
            className="absolute inset-0 block size-full object-cover"
            decoding="async"
            data-testid="respaldo-sisifo"
          />
        )}
        {modo === 'sin-webgl' && (
          <p role="status" className="absolute bottom-5 left-4 z-10 max-w-sm rounded-xl bg-fondo/85 px-3.5 py-2.5 text-sm sm:left-7">
            Tu navegador no está mostrando el 3D (sin WebGL o con la aceleración por hardware desactivada), así que ves imágenes fijas.
          </p>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {FICHAS_COMIDA.map((f, i) => (
            <Insignia
              key={f.nombre}
              nombre={f.nombre}
              refFicha={(el) => {
                fichas.current[i] = el
              }}
            />
          ))}
          <Tarjeta refTarjeta={(el) => {
              hoy.current = el
            }}>
            <span className="rotulo text-texto">Hoy</span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              <span ref={hoyNum}>0</span> <span className="text-base font-normal text-texto-secundario">de {formatoNumero(META_KCAL)} kcal</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-texto/15">
              <i ref={hoyBarra} className="block h-full w-0 rounded-full bg-marca-intensa" />
            </span>
          </Tarjeta>
          <Tarjeta refTarjeta={(el) => {
              ajuste.current = el
            }}>
            <span className="rotulo text-texto">Ajuste semanal</span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              −150 <span className="text-base font-normal text-texto-secundario">kcal desde mañana</span>
            </span>
            <span className="text-sm">
              Según tu <b className="font-semibold text-exito">promedio de 7 días</b>, no un peso suelto.
            </span>
          </Tarjeta>
        </div>
      </div>

      <div className="relative z-10 -mt-[100svh]">
        <div className="flex min-h-svh flex-col items-center px-4 pt-[16svh] text-center sm:px-6">{portada}</div>
        {CAPITULOS_TEXTO.map((c, i) => (
          <article
            key={i}
            data-capitulo
            className={cn(
              'mx-auto flex min-h-svh max-w-6xl flex-col justify-start px-4 pt-24 pb-16 sm:px-6 md:justify-center',
              c.derecha && 'md:items-end md:text-right',
            )}
          >
            <h2 className="max-w-[9.5ch] font-display text-[clamp(3rem,13vw,9rem)] leading-[0.82] font-extrabold tracking-tight uppercase [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">
              {c.titulo.map((w, j) => (
                <span key={j}>
                  <span
                    data-palabra
                    className={cn(
                      'text-texto/40 transition-colors duration-300 motion-reduce:transition-none data-[on]:text-texto',
                      w.acento && 'data-[on]:text-texto-marca',
                    )}
                  >
                    {w.texto}
                  </span>{' '}
                </span>
              ))}
            </h2>
            {c.bajada && <p className="mt-5 max-w-[34ch] text-lg [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]">{c.bajada}</p>}
            {i === CAPITULOS_TEXTO.length - 1 && (
              <figure className="mt-6 [text-shadow:0_1px_14px_rgb(0_0_0/0.6)]">
                <blockquote className="max-w-[20ch] font-serif text-[clamp(1.6rem,2.6vw,2.6rem)] leading-tight">
                  “Hay que imaginar a Sísifo <em className="text-texto-marca">feliz</em>.”
                </blockquote>
                <figcaption className="mt-2 text-sm text-texto">Albert Camus, El mito de Sísifo</figcaption>
              </figure>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

/** Portada (primer capítulo): lema, botones y la palabra KAIBU gigante. */
export function PortadaSisifo({ rutaCrearCuenta }: { rutaCrearCuenta: string }) {
  return (
    <>
      <h1 id="titulo-portada" className="max-w-[22ch] font-serif text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.05] font-medium tracking-normal normal-case [text-shadow:0_2px_24px_rgb(0_0_0/0.3)]">
        Llevar tus comidas no debería ser una <em className="text-texto-marca italic">condena</em>.
      </h1>
      <p className="mt-4 max-w-md text-lg [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]">
        Kaibu calcula tu plan, te deja anotar en segundos y lo ajusta cada semana. Gratis.
      </p>
      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Boton asChild className="rounded-full px-7 sm:min-w-52">
          <Link to={rutaCrearCuenta}>
            Empezar gratis <ArrowRight aria-hidden />
          </Link>
        </Boton>
        <Boton asChild variante="contorno" className="rounded-full bg-fondo/40 px-7 backdrop-blur">
          <Link to="/entrar">Ya tengo cuenta</Link>
        </Boton>
      </div>
      <p className="mt-auto mb-6 flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
        Desliza para subir <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
      </p>
    </>
  )
}
