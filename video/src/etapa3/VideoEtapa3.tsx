// Une cada video de la Etapa 3: escena propia + voz de Francisco + música baja + subtítulos + cierre con QR.
import type { ComponentType, ReactNode } from 'react'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'
import { EscenaCta } from '../comunidad/escenasMarca'
import { crearRitmo, FPS } from '../ritmo'
import { C } from '../tema'
import { Fondo, Subtitulos, s } from './comunes'
import { VIDEOS, type IdVideo } from './datos'
import { V1Calculo } from './V1Calculo'
import { V2Duelo } from './V2Duelo'
import { V3Grafico } from './V3Grafico'
import { V4Quiz } from './V4Quiz'
import { V5SeBusca } from './V5SeBusca'
import { V6Rafaga } from './V6Rafaga'

export interface PropsEtapa3 extends Record<string, unknown> {
  id: IdVideo
  /** Cupos que quedan en la beta (se muestran en el cierre). */
  cupos: number
}

const ESCENAS: Record<IdVideo, ComponentType> = {
  arroz: V1Calculo,
  completo: V2Duelo,
  peso: V3Grafico,
  carne: V4Quiz,
  busco: V5SeBusca,
  cazuela: V6Rafaga,
}

/** Altura de los subtítulos según lo que ocupa cada escena. */
const SUBS_TOP: Record<IdVideo, number> = { arroz: 1400, completo: 1480, peso: 1420, carne: 1420, busco: 1420, cazuela: 1420 }

/** Fundido de entrada del cierre sobre la escena. */
function Entrada({ children }: { children: ReactNode }) {
  const o = interpolate(useCurrentFrame(), [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}

export function VideoEtapa3({ id, cupos }: PropsEtapa3) {
  const d = VIDEOS[id]
  const Escena = ESCENAS[id]
  const total = Math.round(d.duracion * FPS)
  const cierre = s(d.cierre)
  // Solo para el latido suave del botón del cierre.
  const ritmo = crearRitmo('vertical', 'club', { drop: 1, duracion: d.duracion })
  const musica = (f: number) =>
    interpolate(f, [0, 10, s(d.finVoz), s(d.finVoz) + 15, total - 40, total - 2], [0, d.musicaVoz, d.musicaVoz, 0.6, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: C.noche }}>
      <Audio src={staticFile(d.musica.archivo)} trimBefore={Math.round(d.musica.inicio * FPS)} volume={musica} />
      <Audio src={staticFile(d.voz)} volume={1} />
      <Sequence durationInFrames={cierre + 10} name="Escena">
        <Escena />
      </Sequence>
      <Sequence from={cierre} name="Cierre">
        <Entrada>
          <Fondo centro="#2a1517" borde="#0b0909" />
          <EscenaCta dur={total - cierre} ritmo={ritmo} desde={cierre} beta={{ cupos }} />
        </Entrada>
      </Sequence>
      <Sequence durationInFrames={cierre} name="Subtítulos">
        <Subtitulos subs={d.subs} hasta={d.cierre} top={SUBS_TOP[id]} />
      </Sequence>
    </AbsoluteFill>
  )
}
