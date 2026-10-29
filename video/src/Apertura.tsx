// Apertura: la cuenta "de pago", el candado con su precio que se rompe en el drop y aparece Kaibu.
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Aparece, IconoKaibu, Sonido, Titulo } from './componentes'
import { entre, mezclar, miles, suave } from './util'
import { Candado, Entorno, type EstadoCandado } from './Escena3D'
import { GUIONES, type Guion, type Termino } from './guion'
import type { Ritmo } from './ritmo'
import { C, DISPLAY, SANS } from './tema'

interface Momentos {
  formula: number
  q2: number | null
  candado: number
  precio: number
  q3: number
  q4: number
  colegio: number
  q6: number
  q7: number
}

const MOMENTOS = {
  horizontal: { formula: 0.9, q2: 2.8, candado: 4.6, precio: 5.0, q3: 5.4, q4: 7.4, colegio: 9.6, q6: 11.8, q7: 15.4 },
  vertical: { formula: 0.5, q2: null, candado: 1.9, precio: 2.1, q3: 2.3, q4: 3.5, colegio: 4.7, q6: 5.8, q7: 7.8 },
} satisfies Record<string, Momentos>

export function Apertura({ ritmo, dur, guion }: { ritmo: Ritmo; dur: number; guion: Guion }) {
  const g = GUIONES[guion]
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const v = ritmo.formato === 'vertical'
  const m = MOMENTOS[ritmo.formato]
  const F = (s: number) => Math.max(1, ritmo.f(s))
  const t = {
    formula: F(m.formula),
    q2: m.q2 === null ? null : F(m.q2),
    candado: F(m.candado),
    precio: F(m.precio),
    q3: F(m.q3),
    q4: F(m.q4),
    colegio: F(m.colegio),
    q6: F(m.q6),
    drop: ritmo.dropFrame,
    q7: F(m.q7),
  }
  const latido = ritmo.latido(frame)
  const tamTitulo = v ? 74 : 80
  const arriba = v ? 240 : 110
  const salidaFinal = suave(frame, dur - 14, 14)

  return (
    <AbsoluteFill>
      {/* Sonidos de cada momento */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Sonido key={`b${i}`} efecto="blip" en={t.formula + i * 3} vol={0.3} tono={1 + i * 0.07} />
      ))}
      <Sonido efecto="whoosh-grave" en={t.candado - 6} vol={0.35} />
      <Sonido efecto="golpe" en={t.candado + 6} vol={0.75} />
      <Sonido efecto="sello" en={t.precio + 2} vol={0.7} />
      <Sonido efecto="whoosh" en={t.colegio} vol={0.35} />
      {[1, 3, 5].map((i) => (
        <Sonido key={`g${i}`} efecto="tic" en={t.colegio + i * 2 + 5} vol={0.5} tono={0.9 + i * 0.05} />
      ))}
      <Sonido efecto="conteo" en={t.colegio + 16} vol={0.45} />
      <Sonido efecto="whoosh-grave" en={t.q6} vol={0.4} />
      <Sonido efecto="subida" en={t.drop - 72} vol={0.55} />
      <Sonido efecto="explosion" en={t.drop - 1} vol={0.9} />
      <Sonido efecto="brillo" en={t.drop + 3} vol={0.45} />
      <Sonido efecto="whoosh-corto" en={t.drop + 8} vol={0.3} />
      <Sonido efecto="whoosh-grave" en={dur - 14} vol={0.3} />

      {/* Fondo frío del "problema"; se apaga en el drop */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(90% 70% at 50% 35%, #1d1718 0%, #0b0909 60%, #050404 100%)',
          opacity: 1 - suave(frame, t.drop, 10),
        }}
      />

      <Formula t={t} vertical={v} cuenta={g.cuenta} />

      {frame >= t.candado - 2 && frame < t.drop + 96 && (
        <ThreeCanvas width={width} height={height} camera={{ fov: 35, position: [0, 0, v ? 15 : 10] }} style={{ position: 'absolute', inset: 0 }}>
          <Entorno />
          <Candado estado={estadoCandado(frame, t, v, latido)} />
        </ThreeCanvas>
      )}

      <Sello t={t} vertical={v} sello={g.sello} />

      {/* Preguntas al espectador */}
      <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
        <Titulo partes={g.apertura.q1} desde={0} hasta={t.q2 ?? t.candado} tam={tamTitulo} alinear="center" />
      </div>
      {t.q2 !== null && (
        <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
          <Titulo partes={g.apertura.q2} desde={t.q2} hasta={t.q3} tam={tamTitulo} alinear="center" />
        </div>
      )}
      <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
        <Titulo partes={g.apertura.q3} desde={t.q3} hasta={t.q4} tam={tamTitulo} alinear="center" />
      </div>
      <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
        <Titulo partes={g.apertura.q4} desde={t.q4} hasta={t.colegio} tam={tamTitulo} alinear="center" />
      </div>
      <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
        <Titulo partes={g.apertura.colegio} desde={t.colegio} hasta={t.q6} tam={tamTitulo} alinear="center" />
      </div>
      <div style={{ position: 'absolute', top: arriba, left: 80, right: 80 }}>
        <Titulo partes={g.apertura.q6} desde={t.q6} hasta={t.drop} tam={tamTitulo} alinear="center" />
      </div>

      <Revelacion t={t} vertical={v} latido={latido} salida={salidaFinal} />

      <div style={{ position: 'absolute', top: v ? 1290 : 800, left: 60, right: 60, opacity: 1 - salidaFinal }}>
        <Titulo partes={g.apertura.q7} desde={t.q7} tam={v ? 96 : 84} alinear="center" />
      </div>

      {/* Destello del drop */}
      <AbsoluteFill style={{ background: '#fff', opacity: interpolate(frame, [t.drop - 1, t.drop, t.drop + 2, t.drop + 11], [0, 0.92, 0.85, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
    </AbsoluteFill>
  )
}

type Tiempos = { formula: number; candado: number; precio: number; colegio: number; q6: number; drop: number }

function estadoCandado(frame: number, t: Tiempos, v: boolean, latido: number): EstadoCandado {
  const base: [number, number, number] = v ? [0, -0.4, 0] : [0, -0.4, 0]
  const lado: [number, number, number] = v ? [2.7, -3.6, -2] : [4.6, 1.0, -2]
  const final: [number, number, number] = v ? [0, -0.5, 0.8] : [0, -0.4, 0.6]
  const caida = spring({ frame: frame - t.candado, fps: 30, config: { damping: 8, mass: 1.1 } })
  const aparte = suave(frame, t.colegio, 14)
  const vuelve = suave(frame, t.q6, 12)
  const amp = suave(frame, t.q6, t.drop - t.q6) * 0.13
  const pos: [number, number, number] = [0, 1, 2].map((i) => {
    const a = mezclar(base[i], lado[i], aparte)
    return mezclar(a, final[i], vuelve)
  }) as [number, number, number]
  pos[1] += (1 - caida) * 7
  pos[0] += Math.sin(frame * 2.7) * amp * 0.7
  const escala = mezclar(mezclar(1, v ? 0.55 : 0.7, aparte), 1.12, vuelve)
  return {
    pos,
    escala,
    rotY: Math.sin(frame / 32) * 0.3 * (1 - vuelve),
    rotZ: (1 - caida) * 0.5 + Math.sin(frame * 1.9) * amp + latido * amp * 1.6,
    grieta: interpolate(frame, [t.q6, t.drop], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    explosion: frame >= t.drop ? frame - t.drop : null,
  }
}

/* ---------- La fórmula ---------- */

function Formula({ t, vertical, cuenta: cu }: { t: Tiempos & { q7: number }; vertical: boolean; cuenta: (typeof GUIONES)[Guion]['cuenta'] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < t.formula - 1 || frame > t.drop + 40) return null
  const tam = vertical ? 118 : 96
  // Se atenúa detrás del candado y se aclara cuando "hacemos la cuenta".
  const atenuado = Math.max(0, suave(frame, t.candado, 10) - suave(frame, t.colegio, 10)) + suave(frame, t.q6, 12) * 0.6
  const resultado = spring({ frame: frame - t.colegio - 16, fps, config: { damping: 12 } })
  const cuenta = interpolate(frame, [t.colegio + 16, t.colegio + 40], [0, cu.objetivo], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const rompe = frame >= t.drop ? frame - t.drop : -1

  const termino = (i: number) => {
    const x: Termino = cu.terminos[i]
    const p = spring({ frame: frame - t.formula - i * 3, fps, config: { damping: 15 } })
    const giro = x.variable ? interpolate(frame, [t.colegio + i * 2, t.colegio + i * 2 + 10], [0, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0
    const muestraValor = giro > 90
    let explota = ''
    if (rompe >= 0) {
      const d = 18 * (1 - Math.exp(-rompe / 10)) * 60
      const ang = random(`f${i}`) * Math.PI * 2
      explota = ` translate3d(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px, ${d * 0.8}px) rotate(${(random(`fr${i}`) - 0.5) * rompe * 8}deg)`
    }
    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          margin: '0 0.14em',
          opacity: p * (rompe >= 0 ? Math.max(0, 1 - rompe / 22) : 1),
          transform: `translateZ(${(1 - p) * -900}px) rotateX(${(1 - p) * 70 + (muestraValor ? giro - 180 : giro)}deg)${explota}`,
          color: x.variable ? (muestraValor ? '#fff' : C.ambar) : C.tinta,
          borderBottom: x.variable && muestraValor ? `${tam * 0.06}px solid ${C.ambar}` : 'none',
        }}
      >
        {muestraValor ? x.variable : x.t}
      </span>
    )
  }

  return (
    <AbsoluteFill style={{ perspective: 1400, alignItems: 'center', justifyContent: 'center', paddingTop: vertical ? 120 : 140 }}>
      <div style={{ opacity: 1 - atenuado * 0.7, filter: `blur(${atenuado * 5}px)`, textAlign: 'center', transformStyle: 'preserve-3d' }}>
        <Aparece desde={t.formula + 6} hasta={t.drop + 2} style={{ fontFamily: SANS, fontSize: vertical ? 30 : 26, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.tintaSuave, marginBottom: 26 }}>
          {cu.etiqueta}
        </Aparece>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: tam, lineHeight: 1.12, transformStyle: 'preserve-3d' }}>
          {vertical
            ? cu.lineasV.map((l, n) => (
                <div key={n} style={{ transformStyle: 'preserve-3d' }}>
                  {l.map(termino)}
                </div>
              ))
            : cu.terminos.map((_, i) => termino(i))}
        </div>
        {frame >= t.colegio + 14 && (
          <div
            style={{
              marginTop: 24,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: tam * 0.95,
              color: '#e8555c',
              opacity: resultado * (rompe >= 0 ? Math.max(0, 1 - rompe / 12) : 1),
              transform: `scale(${0.7 + 0.3 * resultado})`,
            }}
          >
            {cu.antes}
            {miles(cuenta)}
            {cu.despues}
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

/* ---------- Sello del precio ---------- */

function Sello({ t, vertical, sello }: { t: Tiempos; vertical: boolean; sello: (typeof GUIONES)[Guion]['sello'] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < t.precio || frame > t.colegio + 12) return null
  const p = spring({ frame: frame - t.precio, fps, config: { damping: 10, mass: 0.7 } })
  const sale = suave(frame, t.colegio, 12)
  return (
    <div
      style={{
        position: 'absolute',
        left: vertical ? 330 : 1180,
        top: vertical ? 470 : 300,
        transform: `rotate(${mezclar(-28, -9, p)}deg) scale(${mezclar(2.3, 1, p) * (1 - sale * 0.3)})`,
        opacity: entre(p * 2, 0, 1) * (1 - sale),
        border: '6px solid #e8555c',
        borderRadius: 18,
        padding: '10px 26px 14px',
        background: 'rgba(209,52,60,0.14)',
        color: '#ff6b72',
        fontFamily: DISPLAY,
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(209,52,60,0.35)',
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.18em' }}>{sello.arriba}</div>
      <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.95 }}>{sello.precio}</div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.18em' }}>{sello.abajo}</div>
    </div>
  )
}

/* ---------- Drop: aparece Kaibu ---------- */

function Revelacion({ t, vertical, latido, salida }: { t: Tiempos; vertical: boolean; latido: number; salida: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < t.drop) return null
  const p = spring({ frame: frame - t.drop - 2, fps, config: { damping: 9, mass: 0.8 } })
  const tam = vertical ? 300 : 230
  const centroY = vertical ? 800 : 400
  const anillo = (retraso: number, color: string) => {
    const q = entre((frame - t.drop - retraso) / 26, 0, 1)
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: centroY,
          width: 400,
          height: 400,
          margin: -200,
          borderRadius: '50%',
          border: `${10 * (1 - q)}px solid ${color}`,
          transform: `scale(${0.2 + q * 4})`,
          opacity: q > 0 ? 1 - q : 0,
        }}
      />
    )
  }
  return (
    <AbsoluteFill style={{ perspective: 1600, opacity: 1 - salida, transform: `translateY(${-salida * 60}px) scale(${1 - salida * 0.25})` }}>
      {anillo(0, C.marcaIntensa)}
      {anillo(5, C.ambar)}
      {anillo(10, C.cielo)}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: centroY,
          width: tam * 3.2,
          height: tam * 3.2,
          margin: -tam * 1.6,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(209,52,60,${0.55 + latido * 0.25}) 0%, rgba(179,32,42,0.15) 45%, transparent 70%)`,
          opacity: p,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: centroY,
          width: tam,
          height: tam,
          margin: -tam / 2,
          transform: `rotateY(${(1 - p) * -140}deg) scale(${p * (1 + latido * 0.04)})`,
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))',
        }}
      >
        <IconoKaibu tam={tam} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: centroY + tam / 2 + 40,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: vertical ? 150 : 120,
          letterSpacing: '0.14em',
          color: C.tinta,
          lineHeight: 1,
        }}
      >
        {'KAIBU'.split('').map((l, i) => {
          const q = spring({ frame: frame - t.drop - 8 - i * 2, fps, config: { damping: 13 } })
          return (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
              <span style={{ display: 'inline-block', transform: `translateY(${(1 - q) * 110}%)` }}>{l}</span>
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
