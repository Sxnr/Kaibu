/* eslint-disable react-refresh/only-export-components -- Remotion no usa recarga en caliente. */
// Piezas comunes de los 6 videos de la Etapa 3: tiempo, subtítulos, teléfono, sellos y números que cuentan.
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Pantalla, Sonido, Telefono, type Efecto } from '../componentes'
import { FPS } from '../ritmo'
import { C, DISPLAY, SANS } from '../tema'
import { entre, suave } from '../util'
import type { Sub } from './datos'

/** Segundos de la voz → cuadros. */
export const s = (seg: number) => Math.round(seg * FPS)

/** Resorte que parte en el segundo `seg` (0 antes, ~1 después). */
export function useResorte(seg: number, config: { damping?: number; mass?: number } = {}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - s(seg), fps, config: { damping: 13, mass: 0.8, ...config } })
}

/** 0 → 1 entre dos segundos (lineal y acotado). */
export function useTramo(desde: number, hasta: number) {
  const frame = useCurrentFrame()
  return entre((frame / FPS - desde) / Math.max(0.01, hasta - desde), 0, 1)
}

/** Visible entre dos segundos, con entrada y salida suaves (para bloques de cada momento). */
export function Momento({ desde, hasta, children, salida = 8 }: { desde: number; hasta: number; children: ReactNode; salida?: number }) {
  const frame = useCurrentFrame()
  if (frame < s(desde) - 1 || frame > s(hasta) + salida) return null
  const o = suave(frame, s(desde), 8) * (1 - suave(frame, s(hasta), salida))
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}

export function Fondo({ centro, borde, children }: { centro: string; borde: string; children?: ReactNode }) {
  return <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 38%, ${centro} 0%, ${borde} 72%)` }}>{children}</AbsoluteFill>
}

/** Números y unidades resaltados en ámbar dentro del subtítulo. */
function resaltar(texto: string) {
  return texto.split(/(\d[\d.,]*\s?(?:%|g\b|kcal)?)/).map((p, i) => (i % 2 ? <span key={i} style={{ color: C.ambar }}>{p}</span> : <span key={i}>{p}</span>))
}

/** Subtítulos estilo TikTok: frase corta, grande y centrada, sincronizada con la voz. */
export function Subtitulos({ subs, hasta, top = 1300 }: { subs: Sub[]; hasta: number; top?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / FPS
  const sub = [...subs].reverse().find((x) => x.desde <= t)
  if (!sub || t >= hasta) return null
  const p = spring({ frame: frame - s(sub.desde), fps, config: { damping: 12, mass: 0.5 } })
  const sale = 1 - suave(frame, s(hasta) - 6, 6)
  return (
    <div style={{ position: 'absolute', left: 80, right: 140, top, display: 'flex', justifyContent: 'center', opacity: sale }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.16,
          letterSpacing: '-0.02em',
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 4px 0 rgba(0,0,0,0.55), 0 0 30px rgba(0,0,0,0.65)',
          WebkitTextStroke: '2px rgba(0,0,0,0.35)',
          transform: `scale(${0.82 + 0.18 * p}) translateY(${(1 - p) * 20}px)`,
          opacity: entre(p * 2, 0, 1),
        }}
      >
        {resaltar(sub.texto)}
      </span>
    </div>
  )
}

/** Texto grande de impacto (fuente condensada en mayúsculas). */
export function Grande({ texto, en, color = C.tinta, tam = 150, style, sonido = 'golpe' }: { texto: ReactNode; en: number; color?: string; tam?: number; style?: CSSProperties; sonido?: Efecto | false }) {
  const p = useResorte(en, { damping: 9, mass: 0.7 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, textAlign: 'center', ...style }}>
      {sonido && <Sonido efecto={sonido} en={s(en)} vol={0.4} />}
      <span
        style={{
          display: 'inline-block',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: tam,
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color,
          transform: `scale(${1.5 - 0.5 * p})`,
          opacity: entre(p * 1.6, 0, 1),
        }}
      >
        {texto}
      </span>
    </div>
  )
}

/** Sello que cae y golpea (con rotación). */
export function Sello({ texto, en, color = C.marcaIntensa, rot = -10, tam = 92, style }: { texto: ReactNode; en: number; color?: string; rot?: number; tam?: number; style?: CSSProperties }) {
  const p = useResorte(en, { damping: 8, mass: 0.7 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', display: 'flex', justifyContent: 'center', ...style }}>
      <Sonido efecto="sello" en={s(en)} vol={0.6} />
      <span
        style={{
          border: `8px solid ${color}`,
          borderRadius: 22,
          padding: '10px 30px',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: tam,
          letterSpacing: '0.08em',
          color,
          background: 'rgba(10,8,8,0.55)',
          transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * p})`,
          opacity: entre(p * 1.8, 0, 1),
          whiteSpace: 'nowrap',
        }}
      >
        {texto}
      </span>
    </div>
  )
}

/** Número que cuenta de `de` a `a` entre dos segundos (con sonido de conteo). */
export function useConteo(de: number, a: number, desde: number, dur = 0.8) {
  const p = useTramo(desde, desde + dur)
  return Math.round(de + (a - de) * (1 - Math.pow(1 - p, 3)))
}

interface PropsTelefono {
  src: string
  desde: number
  hasta?: number
  k?: number
  x?: number
  y?: number
  giro?: number
  scroll?: number
  encima?: (k: number) => ReactNode
  barra?: string
}

/** Teléfono con una pantalla real de Kaibu que entra girando y flota. */
export function TelefonoKaibu({ src, desde, hasta, k = 1.15, x = 0, y = 120, giro = 0, scroll = 0, encima, barra }: PropsTelefono) {
  const frame = useCurrentFrame()
  const p = useResorte(desde, { damping: 15, mass: 0.9 })
  if (frame < s(desde) - 1 || (hasta !== undefined && frame > s(hasta) + 12)) return null
  const sale = hasta === undefined ? 0 : suave(frame, s(hasta), 12)
  const pose = {
    x: x + Math.sin(frame / 41) * 8 + sale * 900,
    y: y + (1 - p) * 1100 + Math.sin(frame / 27) * 8,
    z: (1 - p) * -400,
    rx: 6 + (1 - p) * 35 + Math.sin(frame / 45) * 2,
    ry: giro + (1 - p) * -20 + Math.sin(frame / 53) * 3,
    rz: (1 - p) * 6 + sale * 12,
  }
  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      <Sonido efecto="whoosh" en={s(desde)} vol={0.3} />
      <Telefono k={k} pose={pose} pantalla={<Pantalla k={k} src={src} scroll={scroll} barra={barra} />} encima={encima?.(k)} />
    </AbsoluteFill>
  )
}

/** Tarjeta oscura con borde de color (datos, rivales, opciones). */
export function Tarjeta({ children, color, style }: { children: ReactNode; color: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 34,
        background: C.nocheSuperficie,
        border: `3px solid ${color}`,
        boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 40px ${color}33`,
        padding: 34,
        fontFamily: SANS,
        color: C.tinta,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Barra horizontal que se llena (comparaciones). */
export function Barra({ pct, color, alto = 34, etiqueta }: { pct: number; color: string; alto?: number; etiqueta?: ReactNode }) {
  return (
    <div style={{ position: 'relative', height: alto, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${entre(pct, 0, 1) * 100}%`, background: color, borderRadius: 999 }} />
      {etiqueta && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 18, fontWeight: 700, fontSize: alto * 0.62, color: '#fff' }}>{etiqueta}</div>}
    </div>
  )
}

/** Destello blanco breve (cortes rápidos). */
export function Destello({ en, fuerza = 0.5 }: { en: number; fuerza?: number }) {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [s(en), s(en) + 2, s(en) + 7], [0, fuerza, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  if (o <= 0) return null
  return <AbsoluteFill style={{ background: '#fff', opacity: o }} />
}
