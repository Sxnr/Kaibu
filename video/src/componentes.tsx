// Piezas visuales reutilizables: logo, títulos animados, teléfono 3D y tarjetas que "salen" de la pantalla.
import type { CSSProperties, ReactNode } from 'react'
import { Audio, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, SANS } from './tema'
import { entre, suave } from './util'

/* ---------- Sonido ---------- */

export type Efecto =
  | 'whoosh-corto' | 'whoosh' | 'whoosh-grave' | 'swish' | 'pop' | 'tic' | 'blip' | 'tecla' | 'toque'
  | 'conteo' | 'golpe' | 'sello' | 'subida' | 'explosion' | 'brillo' | 'ding'

/** Efecto de sonido que parte en el frame `en` (relativo a la secuencia actual). */
export function Sonido({ efecto, en, vol = 0.5, tono = 1 }: { efecto: Efecto; en: number; vol?: number; tono?: number }) {
  return (
    <Sequence from={Math.round(en)} durationInFrames={80} layout="none" name={`♪ ${efecto}`}>
      <Audio src={staticFile(`sonidos/${efecto}.wav`)} volume={vol} playbackRate={tono} />
    </Sequence>
  )
}

/* ---------- Logo ---------- */

export function FormaK({ color = '#fff' }: { color?: string }) {
  return (
    <g fill={color}>
      <rect x="124" y="118" width="78" height="276" />
      <polygon points="135.4,315.4 190.6,370.6 357.6,203.6 302.4,148.4" />
      <polygon points="388,118 388,262 244,118" />
      <polygon points="267.3,245 386.2,394 283.8,394 204.8,295" />
    </g>
  )
}

export function IconoKaibu({ tam, style }: { tam: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 512 512" width={tam} height={tam} style={style}>
      <rect width="512" height="512" rx="112" fill={C.marca} />
      <g transform="translate(256 256) scale(0.92) translate(-256 -256)">
        <FormaK />
      </g>
    </svg>
  )
}

/* ---------- Títulos con palabras que entran una a una ---------- */

export interface Parte {
  t: string
  /** Color de fondo de la píldora (como "por fases." en la landing). */
  pildora?: string
  colorPildora?: string
  color?: string
}

interface TituloProps {
  partes: Parte[]
  desde: number
  hasta?: number
  tam: number
  alinear?: 'left' | 'center'
  style?: CSSProperties
  colorBase?: string
  peso?: number
  /** Sonido al entrar (false = sin sonido). */
  sonido?: Efecto | false
}

export function Titulo({ sonido = 'whoosh-corto', ...props }: TituloProps) {
  return (
    <>
      {sonido && <Sonido efecto={sonido} en={props.desde - 2} vol={0.32} />}
      <TituloTexto {...props} />
    </>
  )
}

function TituloTexto({ partes, desde, hasta, tam, alinear = 'left', style, colorBase = C.tinta, peso = 560 }: TituloProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  let i = 0
  const salida = hasta === undefined ? 0 : suave(frame, hasta - 8, 8)
  if (frame < desde - 1 || salida >= 1) return null
  const palabra = (texto: string, extra: CSSProperties = {}) => {
    const p = spring({ frame: frame - desde - i++ * 2.5, fps, config: { damping: 16, mass: 0.7 } })
    return (
      <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
        <span
          style={{
            display: 'inline-block',
            transform: `translateY(${(1 - p) * 105 - salida * 105}%) rotate(${(1 - p) * 6}deg)`,
            ...extra,
          }}
        >
          {texto}
        </span>
      </span>
    )
  }
  return (
    <div
      style={{
        fontFamily: SANS,
        fontWeight: peso,
        fontSize: tam,
        lineHeight: 1.08,
        letterSpacing: '-0.035em',
        color: colorBase,
        textAlign: alinear,
        opacity: 1 - salida,
        ...style,
      }}
    >
      {partes.map((parte, n) => {
        if (parte.pildora) {
          const p = spring({ frame: frame - desde - i * 2.5, fps, config: { damping: 11, mass: 0.6 } })
          return (
            <span key={n}>
              {' '}
              <span
                style={{
                  display: 'inline-block',
                  background: parte.pildora,
                  color: parte.colorPildora ?? '#fff',
                  borderRadius: 999,
                  padding: '0 0.36em 0.08em',
                  margin: '0.06em 0',
                  transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -4}deg)`,
                  opacity: p,
                }}
              >
                {parte.t.split(' ').map((w, k, arr) => (
                  <span key={k}>
                    {palabra(w)}
                    {k < arr.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            </span>
          )
        }
        return (
          <span key={n} style={{ color: parte.color }}>
            {n > 0 ? ' ' : ''}
            {parte.t.split(' ').map((w, k, arr) => (
              <span key={k}>
                {palabra(w)}
                {k < arr.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        )
      })}
    </div>
  )
}

/** Texto chico que aparece con un fundido (subtítulos y rótulos). */
export function Aparece({ desde, hasta, children, style }: { desde: number; hasta?: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const p = suave(frame, desde, 14)
  const s = hasta === undefined ? 0 : suave(frame, hasta - 8, 8)
  if (p <= 0 || s >= 1) return null
  return <div style={{ opacity: p * (1 - s), transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>
}

/* ---------- Teléfono 3D (CSS) ---------- */

export const PANTALLA_W = 390
/** 44 de barra de estado + 844 de la vista de la app. */
export const PANTALLA_H = 888
export const BARRA_ESTADO = 44

export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz?: number
}

interface TelefonoProps {
  k: number
  pose: Pose
  pantalla: ReactNode
  /** Elementos en el mismo espacio 3D que la pantalla (tarjetas que se elevan). */
  encima?: ReactNode
  dorso?: ReactNode
}

export function Telefono({ k, pose, pantalla, encima, dorso }: TelefonoProps) {
  const borde = 13 * k
  const W = PANTALLA_W * k + borde * 2
  const H = PANTALLA_H * k + borde * 2
  const radio = 62 * k
  const capas = 12
  const brillo = entre(0.5 + pose.ry / 60, 0, 1)
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: W,
        height: H,
        marginLeft: -W / 2,
        marginTop: -H / 2,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz ?? 0}deg)`,
      }}
    >
      {/* Grosor del equipo: capas apiladas hacia atrás */}
      {Array.from({ length: capas }, (_, n) => (
        <div
          key={n}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radio,
            background: n === capas - 1 ? '#120e0e' : `hsl(0 6% ${22 - n * 0.8}%)`,
            transform: `translateZ(${-(n + 1) * 1.7 * k}px)`,
          }}
        />
      ))}
      {/* Dorso con el logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radio,
          background: 'linear-gradient(150deg, #2b2323, #120e0e 60%, #241c1c)',
          transform: `translateZ(${-(capas + 1) * 1.7 * k}px) rotateY(180deg)`,
          backfaceVisibility: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {dorso ?? <IconoKaibu tam={110 * k} style={{ opacity: 0.9 }} />}
      </div>
      {/* Frente */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radio,
          padding: borde,
          background: 'linear-gradient(145deg, #3d3434, #161212 45%, #2c2424)',
          boxShadow: `inset 0 0 0 ${2 * k}px rgba(255,255,255,0.10)`,
          backfaceVisibility: 'hidden',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: radio - borde, overflow: 'hidden', background: C.fondo }}>
          {pantalla}
          {/* Isla superior */}
          <div style={{ position: 'absolute', top: 11 * k, left: '50%', width: 108 * k, height: 30 * k, marginLeft: -54 * k, borderRadius: 99, background: '#000' }} />
          {/* Reflejo que se mueve con el giro */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(115deg, transparent ${20 + brillo * 30}%, rgba(255,255,255,0.16) ${30 + brillo * 30}%, transparent ${42 + brillo * 30}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
      {/* Contenido elevado (en coordenadas de la pantalla) */}
      <div style={{ position: 'absolute', left: borde, top: borde, width: PANTALLA_W * k, height: PANTALLA_H * k, transformStyle: 'preserve-3d' }}>{encima}</div>
    </div>
  )
}

/** Barra de estado del teléfono (hora y batería). */
function BarraEstado({ k, oscuro }: { k: number; oscuro?: boolean }) {
  const c = oscuro ? C.tinta : C.texto
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: BARRA_ESTADO * k,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${4 * k}px ${30 * k}px 0`,
        fontFamily: SANS,
        fontWeight: 650,
        fontSize: 15 * k,
        color: c,
        zIndex: 2,
      }}
    >
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 5 * k, alignItems: 'center' }}>
        {[5, 8, 11, 14].map((h) => (
          <span key={h} style={{ width: 3 * k, height: h * 0.75 * k, background: c, borderRadius: 1 }} />
        ))}
        <span style={{ marginLeft: 5 * k, width: 24 * k, height: 11 * k, border: `${1.4 * k}px solid ${c}`, borderRadius: 3 * k, padding: 1.2 * k }}>
          <span style={{ display: 'block', width: '80%', height: '100%', background: c, borderRadius: 1.5 * k }} />
        </span>
      </span>
    </div>
  )
}

interface PantallaProps {
  k: number
  src: string
  /** Desplazamiento vertical en px de la app (vista de 390 de ancho). */
  scroll?: number
  barra?: string
  oscuro?: boolean
  x?: number
  opacidad?: number
  atenuar?: number
  children?: ReactNode
}

/** Una pantalla real de la app, con barra de estado y desplazamiento fluido. */
export function Pantalla({ k, src, scroll = 0, barra, oscuro, x = 0, opacidad = 1, atenuar = 0, children }: PantallaProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: oscuro ? C.noche : C.fondo, opacity: opacidad, transform: `translateX(${x}%)` }}>
      <Img src={staticFile(`capturas/${src}.png`)} style={{ position: 'absolute', left: 0, top: (BARRA_ESTADO - scroll) * k, width: PANTALLA_W * k }} />
      {children}
      {barra && <Img src={staticFile(`capturas/${barra}.png`)} style={{ position: 'absolute', left: 0, bottom: 0, width: PANTALLA_W * k }} />}
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: atenuar * 0.2 }} />
      <BarraEstado k={k} oscuro={oscuro} />
    </div>
  )
}

/** Marca de toque (dedo) sobre la pantalla. */
export function Toque(props: { k: number; x: number; y: number; en: number }) {
  return (
    <>
      <Sonido efecto="toque" en={props.en} vol={0.55} />
      <ToqueVisual {...props} />
    </>
  )
}

function ToqueVisual({ k, x, y, en }: { k: number; x: number; y: number; en: number }) {
  const frame = useCurrentFrame()
  const t = frame - en
  if (t < -6 || t > 16) return null
  const llegada = entre((t + 6) / 6, 0, 1)
  const onda = entre(t / 14, 0, 1)
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x * k,
          top: (y + BARRA_ESTADO) * k,
          width: 44 * k,
          height: 44 * k,
          margin: -22 * k,
          borderRadius: 99,
          background: 'rgba(26,20,20,0.28)',
          border: `${2 * k}px solid rgba(255,255,255,0.8)`,
          opacity: llegada * (1 - onda * 0.8),
          transform: `scale(${t < 0 ? 1.3 - llegada * 0.3 : 1 - Math.sin(entre(t / 4, 0, 1) * Math.PI) * 0.15})`,
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x * k,
          top: (y + BARRA_ESTADO) * k,
          width: 44 * k,
          height: 44 * k,
          margin: -22 * k,
          borderRadius: 99,
          border: `${2 * k}px solid ${C.marca}`,
          opacity: t >= 0 ? 1 - onda : 0,
          transform: `scale(${1 + onda * 1.8})`,
          zIndex: 3,
        }}
      />
    </>
  )
}

/* ---------- Tarjetas que se elevan desde la pantalla ---------- */

interface ElevarProps {
  k: number
  /** Zona de la pantalla donde nace (coordenadas de la app, 390 de ancho). */
  de: { x: number; y: number; w: number }
  a: { dx: number; dy: number; z: number; ry?: number; rx?: number; escala?: number }
  en: number
  hasta: number
  children: ReactNode
  flotar?: number
  /** Alto de la zona que se marca antes de elevarse (px de la app). */
  alto?: number
  /** Si la tarjeta tiene un número que cuenta (suena "tic-tic-tic"). */
  conteo?: boolean
}

/** Antes de elevarse, un marco rojo pulsa sobre la zona: "mira esto". */
export const ANTICIPO = 12

export function Elevar(props: ElevarProps) {
  const { en, conteo } = props
  return (
    <>
      <Sonido efecto="ding" en={en - ANTICIPO} vol={0.18} tono={1.25} />
      <Sonido efecto="whoosh" en={en - 3} vol={0.38} />
      <Sonido efecto="pop" en={en + 3} vol={0.5} />
      {conteo && <Sonido efecto="conteo" en={en + 5} vol={0.36} />}
      <Sonido efecto="swish" en={props.hasta - 2} vol={0.16} />
      <Marco {...props} />
      <ElevarVisual {...props} />
    </>
  )
}

function Marco({ k, de, en, alto = 80 }: ElevarProps) {
  const frame = useCurrentFrame()
  const t = frame - (en - ANTICIPO)
  if (t < 0 || t > ANTICIPO + 14) return null
  const aparece = entre(t / 5, 0, 1)
  const sale = entre((t - ANTICIPO) / 14, 0, 1)
  return (
    <div
      style={{
        position: 'absolute',
        left: (de.x - 4) * k,
        top: (de.y + BARRA_ESTADO - 4) * k,
        width: (de.w + 8) * k,
        height: (alto + 8) * k,
        borderRadius: 22 * k,
        border: `${3 * k}px solid ${C.marcaIntensa}`,
        boxShadow: `0 0 ${26 * k}px rgba(209,52,60,0.65), inset 0 0 ${18 * k}px rgba(209,52,60,0.25)`,
        opacity: aparece * (1 - sale),
        transform: `translateZ(2px) scale(${1 + Math.sin(t / 2.2) * 0.025 + sale * 0.08})`,
      }}
    />
  )
}

function ElevarVisual({ k, de, a, en, hasta, children, flotar = 0 }: ElevarProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < en - 1 || frame > hasta + 12) return null
  const p = spring({ frame: frame - en, fps, config: { damping: 13, mass: 0.9 } })
  const s = suave(frame, hasta, 12)
  const vaiven = Math.sin((frame - en) / 22) * 6 * k * flotar
  const q = p * (1 - s)
  return (
    <div
      style={{
        position: 'absolute',
        left: de.x * k,
        top: (de.y + BARRA_ESTADO) * k,
        width: de.w * k,
        transformOrigin: 'top left',
        transform: `translate3d(${a.dx * q}px, ${a.dy * q + vaiven}px, ${a.z * q + 1}px) rotateY(${(a.ry ?? 0) * q}deg) rotateX(${(a.rx ?? 0) * q}deg) scale(${1 + ((a.escala ?? 1.08) - 1) * q})`,
        opacity: entre((frame - en) / 4, 0, 1) * (1 - s),
        filter: `drop-shadow(0 ${30 * q * k}px ${40 * q * k}px rgba(0,0,0,${0.5 * q}))`,
      }}
    >
      {children}
    </div>
  )
}

/** Caja con el estilo de las tarjetas de la app. */
export function Caja({ k, children, style }: { k: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: C.superficie,
        border: `${1 * k}px solid ${C.borde}`,
        borderRadius: 24 * k,
        padding: 18 * k,
        color: C.texto,
        fontFamily: SANS,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Barra que se llena (macros, avance). */
export function Llenado({ k, pct, color, p }: { k: number; pct: number; color: string; p: number }) {
  return (
    <div style={{ height: 8 * k, borderRadius: 99, background: C.elevada, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct * p}%`, background: color, borderRadius: 99 }} />
    </div>
  )
}
