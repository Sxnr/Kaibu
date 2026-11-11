// Demostración del MVP (Start-Up Chile): la grabación real de la app dentro de un celular que flota en 3D,
// con la voz de Francisco, el menú de funciones a la izquierda y el dato clave de cada escena a la derecha.
// Estilo inspirado en un teaser: fondo de espacio, texto que se escribe solo y cambios rápidos.
import { useMemo } from 'react'
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from 'remotion'
import { FPS } from '../ritmo'
import { C, DISPLAY, SANS } from '../tema'
import { DURACION, ESCENAS, FIN_VOZ, INICIO_CIERRE, MUSICA, SUBTITULOS } from './datos'

const s = (segundos: number) => Math.round(segundos * FPS)
const ALTO_PANTALLA = 820
const ANCHO_PANTALLA = Math.round(ALTO_PANTALLA * (390 / 844))
const CENTRO_X = 930
const INICIO_TEL = s(1.0)
const SALIDA_TEL = s(61.3)

/** Índice de la escena activa (o -1 antes de la primera / -2 en el cierre). */
function escenaEn(t: number): number {
  if (t >= INICIO_CIERRE) return -2
  return ESCENAS.findIndex((e) => t >= e.voz[0] && t < e.voz[1])
}

function Estrellas() {
  const frame = useCurrentFrame()
  const puntos = useMemo(
    () => Array.from({ length: 170 }, (_, i) => ({ x: random(`x${i}`) * 1920, y: random(`y${i}`) * 1080, r: 0.6 + random(`r${i}`) * 1.8, f: random(`f${i}`) * 6 })),
    [],
  )
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {puntos.map((p, i) => (
        <circle key={i} cx={(p.x - frame * 0.15 * p.r + 1920) % 1920} cy={p.y} r={p.r} fill="#fff" opacity={0.25 + 0.35 * Math.abs(Math.sin(frame / 40 + p.f))} />
      ))}
    </svg>
  )
}

function Resplandor() {
  const frame = useCurrentFrame()
  const pulso = 1 + 0.06 * Math.sin(frame / 18)
  const nace = interpolate(frame, [s(0.6), s(1.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute', left: CENTRO_X - 520, top: 540 - 520, width: 1040, height: 1040, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.marca}55 0%, ${C.marcaOscura}33 35%, transparent 68%)`,
        transform: `scale(${pulso * nace})`, filter: 'blur(10px)',
      }}
    />
  )
}

function TextoInicial() {
  const frame = useCurrentFrame()
  const texto = 'Así funciona Kaibu hoy'
  const letras = Math.floor(interpolate(frame, [4, 34], [0, texto.length], { extrapolateRight: 'clamp' }))
  const salida = interpolate(frame, [s(1.3), s(1.8)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  if (salida <= 0) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', opacity: salida }}>
      <div style={{ fontFamily: SANS, fontSize: 40, color: C.tinta, padding: '18px 36px', borderRadius: 999, border: '2px solid #ffffff55', background: '#ffffff0d' }}>
        {texto.slice(0, letras)}
        <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>|</span>
      </div>
    </div>
  )
}

/** Pantalla del celular con el tramo de la grabación de cada escena (acelerado para calzar con la voz). */
function Pantalla() {
  const frame = useCurrentFrame()
  const t = frame / FPS
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 44, background: C.noche }}>
      {ESCENAS.map((e, i) => {
        const desde = i === 0 ? INICIO_TEL : s(e.voz[0])
        const largo = s(e.voz[1]) - desde
        const velocidad = (e.rec[1] - e.rec[0]) / (e.voz[1] - e.voz[0])
        const local = (t - e.voz[0]) / (e.voz[1] - e.voz[0])
        const z = e.zoom ? interpolate(local, [0.25, 0.55], [1, e.zoom.escala], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
        return (
          <Sequence key={e.id} from={desde} durationInFrames={largo} layout="none">
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: e.zoom ? `${e.zoom.x}% ${e.zoom.y}%` : 'center' }}>
              <OffthreadVideo muted src={staticFile('mvp/recorrido.mp4')} startFrom={s(e.rec[0])} playbackRate={velocidad} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </Sequence>
        )
      })}
      {/* Cierre: se queda en "Hoy", más lento. */}
      <Sequence from={s(INICIO_CIERRE)} durationInFrames={SALIDA_TEL - s(INICIO_CIERRE) + s(1)} layout="none">
        <OffthreadVideo muted src={staticFile('mvp/recorrido.mp4')} startFrom={s(41.2)} playbackRate={0.55} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
    </div>
  )
}

function Telefono() {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const llegada = spring({ frame: frame - INICIO_TEL, fps: FPS, config: { damping: 15, mass: 0.9 } })
  const salida = spring({ frame: frame - SALIDA_TEL, fps: FPS, config: { damping: 200 }, durationInFrames: s(0.7) })
  // Giro rápido en cada cambio de escena (alternando el lado).
  const i = Math.max(0, escenaEn(t) === -2 ? ESCENAS.length : escenaEn(t))
  const inicioEscena = i < ESCENAS.length ? s(ESCENAS[i]!.voz[0]) : s(INICIO_CIERRE)
  const giro = i === 0 ? 1 : spring({ frame: frame - inicioEscena, fps: FPS, config: { damping: 13, mass: 0.7 } })
  const lado = i % 2 ? 1 : -1
  const rotY = -12 + lado * 30 * (1 - giro) + 4 * Math.sin(frame / 50) - 26 * (1 - llegada)
  const rotX = 4 + 2 * Math.cos(frame / 60) + 38 * (1 - llegada)
  const escala = (0.25 + 0.75 * llegada) * (0.9 + 0.1 * giro) * (1 + 0.6 * salida)
  const desenfoque = 7 * (1 - giro) + 10 * salida
  const opacidad = interpolate(frame, [INICIO_TEL, INICIO_TEL + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (1 - salida)
  if (opacidad <= 0.01) return null
  return (
    <div style={{ position: 'absolute', left: CENTRO_X - ANCHO_PANTALLA / 2, top: 540 - ALTO_PANTALLA / 2 - 30, perspective: 1800 }}>
      <div
        style={{
          width: ANCHO_PANTALLA, height: ALTO_PANTALLA, borderRadius: 56, padding: 12, background: '#16151b',
          boxShadow: `0 40px 120px #000c, 0 0 0 2px #ffffff22, 0 0 80px ${C.marca}44`,
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${escala})`, filter: `blur(${desenfoque}px)`, opacity: opacidad,
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Pantalla />
        </div>
      </div>
    </div>
  )
}

/** Menú de funciones (como la barra del teaser): la activa grande y blanca, las demás tenues. */
function Menu() {
  const frame = useCurrentFrame()
  const activo = ESCENAS.reduce((suma, e, i) => (i === 0 ? suma : suma + spring({ frame: frame - s(e.voz[0]), fps: FPS, config: { damping: 18 } })), 0)
  const visible = interpolate(frame, [s(1.6), s(2.2), s(INICIO_CIERRE), s(INICIO_CIERRE + 0.6)], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ALTO = 96
  return (
    <div style={{ position: 'absolute', left: 110, top: 0, width: 560, height: 1080, opacity: visible, overflow: 'hidden', maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)' }}>
      <div style={{ position: 'absolute', top: 540 - ALTO / 2 - activo * ALTO, left: 0, right: 0 }}>
        {ESCENAS.map((e, i) => {
          const cerca = Math.max(0, 1 - Math.abs(i - activo))
          return (
            <div key={e.id} style={{ height: ALTO, display: 'flex', alignItems: 'center', gap: 22 }}>
              <div style={{ width: 62, height: 62, borderRadius: 16, display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, color: cerca > 0.5 ? '#fff' : C.tintaSuave, background: cerca > 0.5 ? C.marca : '#ffffff10', border: '2px solid #ffffff18' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 54 + 10 * cerca, letterSpacing: 0.5, color: C.tinta, opacity: 0.22 + 0.78 * cerca, textTransform: 'uppercase' }}>{e.menu}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DATOS_CIERRE: { voz: [number, number]; dato: string; detalle: string }[] = [
  { voz: [INICIO_CIERRE, 57.42], dato: 'Beta privada', detalle: 'con usuarios reales' },
  { voz: [57.42, SALIDA_TEL / FPS], dato: 'Google Play', detalle: 'el próximo paso, con Start-Up Chile' },
]

/** Dato clave de cada escena, a la derecha del celular. */
function Dato() {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const lista = [...ESCENAS.map((e) => ({ voz: e.voz, dato: e.dato, detalle: e.detalle })), ...DATOS_CIERRE]
  const actual = lista.find((d) => t >= d.voz[0] && t < d.voz[1])
  if (!actual) return null
  const entra = spring({ frame: frame - s(actual.voz[0]) - 6, fps: FPS, config: { damping: 16 } })
  const sale = interpolate(t, [actual.voz[1] - 0.25, actual.voz[1]], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: 1240, top: 380, width: 600, opacity: entra * (1 - sale), transform: `translateX(${(1 - entra) * 120}px)`, filter: `blur(${(1 - entra) * 8}px)` }}>
      <div style={{ width: 70, height: 6, borderRadius: 3, background: C.marca, marginBottom: 22 }} />
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 0.95, color: '#fff' }}>{actual.dato}</div>
      <div style={{ fontFamily: SANS, fontSize: 36, color: C.tintaSuave, marginTop: 16 }}>{actual.detalle}</div>
    </div>
  )
}

function Subtitulos() {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const actual = SUBTITULOS.find(([a, b]) => t >= a && t < b)
  if (!actual || t >= SALIDA_TEL / FPS) return null
  const entra = interpolate(t, [actual[0], actual[0] + 0.12], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 44, display: 'flex', justifyContent: 'center', opacity: entra }}>
      <div style={{ maxWidth: 1400, fontFamily: SANS, fontWeight: 600, fontSize: 36, lineHeight: 1.3, color: '#fff', textAlign: 'center', padding: '12px 28px', borderRadius: 16, background: '#000000a6' }}>{actual[2]}</div>
    </div>
  )
}

function Cierre() {
  const frame = useCurrentFrame()
  const entra = spring({ frame: frame - SALIDA_TEL - s(0.2), fps: FPS, config: { damping: 14 } })
  if (frame < SALIDA_TEL) return null
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 34, opacity: entra, transform: `scale(${0.9 + 0.1 * entra})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ width: 120, height: 120, borderRadius: 30, background: C.marca, display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, color: '#fff' }}>K</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, letterSpacing: 6, color: '#fff' }}>KAIBU</div>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 40, color: C.tinta }}>Beta en web y Android · Pronto en Google Play</div>
      <div style={{ fontFamily: SANS, fontSize: 32, color: '#fff', padding: '12px 30px', borderRadius: 999, border: `2px solid ${C.marcaIntensa}`, background: `${C.marca}33` }}>kaibu-nine.vercel.app</div>
    </AbsoluteFill>
  )
}

export function MvpDemo() {
  const total = s(DURACION)
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #12131a 0%, #07080b 60%, #040405 100%)' }}>
      <Estrellas />
      <Resplandor />
      <TextoInicial />
      <Menu />
      <Telefono />
      <Dato />
      <Subtitulos />
      <Cierre />
      <Audio src={staticFile('voz/mvp.m4a')} />
      <Audio
        src={staticFile(MUSICA.archivo)}
        volume={(f) => MUSICA.volumen * interpolate(f, [0, s(1), s(FIN_VOZ), total], [0, 1, 1.6, 0], { extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  )
}
