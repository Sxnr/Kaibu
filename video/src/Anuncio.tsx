// El anuncio completo: apertura (problema → drop), recorrido por la app y cierre, al ritmo de la música.
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Apertura } from './Apertura'
import { Cierre } from './Cierre'
import { suave } from './util'
import { Entorno, Figuras } from './Escena3D'
import { Recorrido } from './Recorrido'
import { crearRitmo, FPS, MUSICAS, type Formato, type IdMusica, type Ritmo } from './ritmo'
import { C } from './tema'

export interface PropsAnuncio extends Record<string, unknown> {
  formato: Formato
  musica: IdMusica
  /** Texto de la píldora final (la dirección web cuando se publique). */
  url: string
}

export function Anuncio({ formato, musica, url }: PropsAnuncio) {
  const ritmo = crearRitmo(formato, musica)
  const [apertura, plan, registrar, progreso, beneficios, cierre] = ritmo.secciones
  return (
    <AbsoluteFill style={{ background: C.noche }}>
      <Audio
        src={staticFile(MUSICAS[musica].archivo)}
        trimBefore={Math.round(ritmo.inicioMusica * FPS)}
        volume={(f) => interpolate(f, [0, 8, ritmo.total - 45, ritmo.total - 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
      <Sequence from={ritmo.dropFrame} name="Fondo de marca">
        <FondoMarca ritmo={ritmo} />
      </Sequence>
      <Sequence durationInFrames={apertura.dur} name="Apertura">
        <Apertura ritmo={ritmo} dur={apertura.dur} />
      </Sequence>
      <Sequence from={plan.desde} durationInFrames={beneficios.desde + beneficios.dur - plan.desde} name="Recorrido por la app">
        <Recorrido ritmo={ritmo} secciones={[plan, registrar, progreso, beneficios]} />
      </Sequence>
      <Sequence from={cierre.desde} durationInFrames={cierre.dur} name="Cierre">
        <Cierre ritmo={ritmo} desde={cierre.desde} dur={cierre.dur} url={url} />
      </Sequence>
    </AbsoluteFill>
  )
}

/** Atmósfera de color de Kaibu + figuras 3D que flotan y laten con la música. */
function FondoMarca({ ritmo }: { ritmo: Ritmo }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const global = frame + ritmo.dropFrame
  const latido = ritmo.latido(global)
  const v = ritmo.formato === 'vertical'
  const deriva = (n: number, a: number) => 50 + Math.sin(frame / n) * a
  return (
    <AbsoluteFill style={{ opacity: suave(frame, 0, 10) }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(45% 55% at ${deriva(90, 12) - 30}% ${deriva(70, 8) - 25}%, rgba(179,32,42,${0.55 + latido * 0.12}), transparent 70%)`,
            `radial-gradient(40% 45% at ${deriva(80, 10) + 32}% ${deriva(100, 10) + 30}%, rgba(232,176,75,0.28), transparent 70%)`,
            `radial-gradient(35% 40% at ${deriva(110, 10) + 38}% ${deriva(60, 8) - 32}%, rgba(90,176,230,0.24), transparent 70%)`,
            `radial-gradient(35% 40% at ${deriva(95, 10) - 36}% ${deriva(85, 10) + 34}%, rgba(140,192,132,0.22), transparent 70%)`,
            C.noche,
          ].join(', '),
        }}
      />
      <ThreeCanvas width={width} height={height} camera={{ fov: 35, position: [0, 0, v ? 18 : 14] }} style={{ position: 'absolute', inset: 0 }}>
        <Entorno />
        <Figuras frame={frame} latido={latido} vertical={v} entrada={suave(frame, 6, 40)} />
      </ThreeCanvas>
      {/* Viñeta para que el texto siempre se lea */}
      <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  )
}
