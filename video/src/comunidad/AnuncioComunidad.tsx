// Video de la comunidad: muestra Kaibu y llama a entrar al Discord (link + QR).
// Cada escena dura lo que dura su frase (tiempos.ts); la voz se suma cuando exista.
import type { ReactNode } from 'react'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion'
import { FondoMarca } from '../Anuncio'
import { Sonido } from '../componentes'
import { crearRitmo, FPS, MUSICAS, type Formato } from '../ritmo'
import { C } from '../tema'
import { EscenaAjuste, EscenaPlan, EscenaRegistrar } from './escenasApp'
import { EscenaCobran, EscenaComparte, EscenaCta, EscenaDiscord, EscenaPregunta } from './escenasMarca'
import { CRUCE, Fundido, Subtitulo } from './piezas'
import { TIEMPOS, tramos, type Tramo } from './tiempos'

export interface PropsComunidad extends Record<string, unknown> {
  formato: Formato
}

/** Volumen de la música: baja mientras habla la voz y sube en el cierre. */
function volumenMusica(f: number, total: number, conVoz: boolean, inicioCta: number) {
  const base = conVoz ? interpolate(f, [inicioCta - 10, inicioCta + 10], [0.2, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0.72
  return base * interpolate(f, [0, 8, total - 50, total - 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

export function AnuncioComunidad({ formato }: PropsComunidad) {
  const t = TIEMPOS[formato]
  const ritmo = crearRitmo(formato, 'club', { drop: t.drop, duracion: t.duracion })
  const total = Math.round(t.duracion * FPS)
  const escenas = tramos(t, FPS)
  const cta = escenas.find((e) => e.escena === 'cta')
  const inicioCta = cta?.desde ?? total

  const contenido = (e: Tramo): ReactNode => {
    switch (e.escena) {
      case 'pregunta':
        return <EscenaPregunta dur={e.dur + CRUCE} />
      case 'cobran':
        return <EscenaCobran dur={e.dur + CRUCE} drop={ritmo.dropFrame - e.desde} />
      case 'plan':
        return <EscenaPlan dur={e.dur + CRUCE} />
      case 'registrar':
        return <EscenaRegistrar dur={e.dur + CRUCE} />
      case 'ajuste':
        return <EscenaAjuste dur={e.dur + CRUCE} />
      case 'discord':
        return <EscenaDiscord dur={e.dur + CRUCE} />
      case 'comparte':
        return <EscenaComparte dur={e.dur + CRUCE} />
      case 'cta':
        return <EscenaCta dur={e.dur} ritmo={ritmo} desde={e.desde} />
    }
  }

  return (
    <AbsoluteFill style={{ background: C.noche }}>
      <Audio
        src={staticFile(MUSICAS.club.archivo)}
        trimBefore={Math.round(ritmo.inicioMusica * FPS)}
        volume={(f) => volumenMusica(f, total, t.voz !== null, inicioCta)}
      />
      {t.voz && <Audio src={staticFile(t.voz)} volume={1} />}
      <Sonido efecto="subida" en={ritmo.dropFrame - 60} vol={0.45} />
      <Sonido efecto="explosion" en={ritmo.dropFrame - 1} vol={0.8} />
      <Sonido efecto="brillo" en={ritmo.dropFrame + 3} vol={0.4} />
      <Sequence from={ritmo.dropFrame} name="Fondo de marca">
        <FondoMarca ritmo={ritmo} />
      </Sequence>
      {escenas.map((e, i) => (
        <Sequence key={e.escena} from={e.desde} durationInFrames={e.dur + (i < escenas.length - 1 ? CRUCE : 0)} name={e.escena}>
          <Fundido dur={e.dur + (i < escenas.length - 1 ? CRUCE : 0)} sinEntrada={i === 0}>
            {contenido(e)}
          </Fundido>
        </Sequence>
      ))}
      {escenas.map((e) => (
        <Sequence key={`sub-${e.escena}`} from={e.desde} durationInFrames={e.dur} name={`Subtítulo ${e.escena}`}>
          <Subtitulo texto={e.texto} dur={e.dur} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
