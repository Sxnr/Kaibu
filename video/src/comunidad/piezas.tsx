/* eslint-disable react-refresh/only-export-components -- Remotion no usa recarga en caliente; las piezas comparten constantes. */
// Piezas comunes del video de la comunidad: fundido de escena, subtítulos y escena de teléfono.
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Pantalla, Sonido, Telefono, Titulo, type Parte } from '../componentes'
import { suave } from '../util'
import { C, SANS } from '../tema'

/** Cuadros que se cruzan dos escenas seguidas. */
export const CRUCE = 10

export const useVertical = () => {
  const { width, height } = useVideoConfig()
  return height > width
}

/** Entra y sale con un fundido corto y un leve zoom (las escenas se cruzan CRUCE cuadros). */
export function Fundido({ dur, children, sinEntrada }: { dur: number; children: ReactNode; sinEntrada?: boolean }) {
  const frame = useCurrentFrame()
  const entra = sinEntrada ? 1 : suave(frame, 0, CRUCE)
  const sale = suave(frame, dur - CRUCE, CRUCE)
  return <AbsoluteFill style={{ opacity: entra * (1 - sale), transform: `scale(${1 + sale * 0.04})` }}>{children}</AbsoluteFill>
}

/** Subtítulo de la frase que suena (muchos ven el video sin sonido). */
export function Subtitulo({ texto, dur }: { texto: string; dur: number }) {
  const frame = useCurrentFrame()
  const v = useVertical()
  const p = suave(frame, 2, 8) * (1 - suave(frame, dur - 6, 6))
  const caja: CSSProperties = v
    ? { left: 70, right: 70, top: 1530 }
    : { left: 260, right: 260, bottom: 54 }
  return (
    <div style={{ position: 'absolute', display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, ...caja }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: v ? 44 : 36,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          color: '#fff',
          textAlign: 'center',
          background: 'rgba(10,8,8,0.72)',
          borderRadius: 18,
          padding: v ? '14px 26px' : '10px 24px',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        }}
      >
        {texto}
      </span>
    </div>
  )
}

/** Título grande de la escena (arriba en vertical, a la izquierda en horizontal). */
export function TituloEscena({ partes, desde, hasta, ancho = 760 }: { partes: Parte[]; desde: number; hasta: number; ancho?: number }) {
  const v = useVertical()
  const lugar: CSSProperties = v ? { top: 170, left: 70, right: 70 } : { top: 330, left: 120, width: ancho }
  return (
    <div style={{ position: 'absolute', ...lugar }}>
      <Titulo partes={partes} desde={desde} hasta={hasta} tam={v ? 84 : 84} alinear={v ? 'center' : 'left'} />
    </div>
  )
}

interface PropsEscenaTelefono {
  dur: number
  src: string
  /** Desplazamiento de la pantalla: pares [avance 0..1, px de la app]. */
  scroll?: [number, number][]
  titulo: Parte[]
  /** Cuadro en que entra el teléfono. */
  inicio?: number
  /** Contenido sobre la pantalla (toques y tarjetas que se elevan), con k y la duración. */
  encima?: (k: number) => ReactNode
  /** Elementos 2D alrededor del teléfono. */
  alrededor?: ReactNode
  barra?: string
}

/** Escena tipo: título + teléfono 3D con una pantalla real de Kaibu que flota al ritmo. */
export function EscenaTelefono({ dur, src, scroll = [[0, 0]], titulo, inicio = 0, encima, alrededor, barra }: PropsEscenaTelefono) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useVertical()
  const k = v ? 1.05 : 0.86
  const t = frame - inicio
  const s = spring({ frame: t, fps, config: { damping: 15, mass: 0.9 } })
  const avance = Math.min(1, Math.max(0, t / Math.max(1, dur - inicio)))
  const xs = scroll.map(([p]) => p)
  const ys = scroll.map(([, y]) => y)
  const desplazamiento = xs.length > 1 ? interpolate(avance, xs, ys, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : (ys[0] ?? 0)
  const base = v ? { x: 0, y: 95 } : { x: 450, y: -10 }
  const pose = {
    x: base.x + (1 - s) * (v ? 0 : 500) + Math.sin(frame / 41) * 10,
    y: base.y + (1 - s) * 900 + Math.sin(frame / 27) * 10,
    z: (1 - s) * -500,
    rx: 6 + (1 - s) * 40 + Math.sin(frame / 45) * 2,
    ry: (v ? 0 : -12) + (1 - s) * -25 + Math.sin(frame / 53) * 3,
    rz: (1 - s) * 6 + Math.sin(frame / 37) * 1.2,
  }
  return (
    <AbsoluteFill>
      <Sonido efecto="whoosh" en={inicio} vol={0.32} />
      <TituloEscena partes={titulo} desde={Math.max(3, inicio - 4)} hasta={dur + 20} ancho={700} />
      <AbsoluteFill style={{ perspective: 2400 }}>
        {t >= -1 && <Telefono k={k} pose={pose} pantalla={<Pantalla k={k} src={src} scroll={desplazamiento} barra={barra} />} encima={encima?.(k)} />}
      </AbsoluteFill>
      {alrededor}
    </AbsoluteFill>
  )
}

/** Píldora con ícono (alimentos, roles) que aparece con un rebote. */
export function Pildora({ en, icono, texto, color, style }: { en: number; icono: ReactNode; texto: string; color: string; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useVertical()
  const p = spring({ frame: frame - en, fps, config: { damping: 11, mass: 0.6 } })
  if (frame < en - 1) return null
  return (
    <div
      style={{
        position: 'absolute',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: v ? '16px 28px 16px 18px' : '14px 26px 14px 16px',
        borderRadius: 999,
        background: C.nocheSuperficie,
        border: `2px solid ${color}`,
        boxShadow: `0 18px 40px rgba(0,0,0,0.45), 0 0 24px ${color}55`,
        fontFamily: SANS,
        fontWeight: 650,
        fontSize: v ? 40 : 34,
        color: C.tinta,
        whiteSpace: 'nowrap',
        transform: `scale(${0.4 + 0.6 * p}) translateY(${(1 - p) * 40}px)`,
        opacity: Math.min(1, p * 1.5),
        ...style,
      }}
    >
      <Sonido efecto="pop" en={en} vol={0.4} tono={1.1} />
      <span style={{ display: 'grid', placeItems: 'center', width: v ? 52 : 46, height: v ? 52 : 46, borderRadius: 999, background: color, color: C.noche }}>{icono}</span>
      {texto}
    </div>
  )
}
