// Versiones del video: 2 formatos × 2 temas musicales con el primer guion, y la versión "Kaibu lo adapta gratis".
import { Composition } from 'remotion'
import { Anuncio, type PropsAnuncio } from './Anuncio'
import { AnuncioComunidad, type PropsComunidad } from './comunidad/AnuncioComunidad'
import { TIEMPOS } from './comunidad/tiempos'
import { IDS, VIDEOS } from './etapa3/datos'
import { VideoEtapa3, type PropsEtapa3 } from './etapa3/VideoEtapa3'
import type { Guion } from './guion'
import { FORMATOS, FPS, type Formato, type IdMusica } from './ritmo'
import './tema'

const VERSIONES: { id: string; formato: Formato; musica: IdMusica; guion: Guion }[] = [
  { id: 'Horizontal-Adapta', formato: 'horizontal', musica: 'club', guion: 'adapta' },
  { id: 'Vertical-Adapta', formato: 'vertical', musica: 'club', guion: 'adapta' },
  { id: 'Horizontal-Club', formato: 'horizontal', musica: 'club', guion: 'formula' },
  { id: 'Horizontal-Workout', formato: 'horizontal', musica: 'workout', guion: 'formula' },
  { id: 'Vertical-Club', formato: 'vertical', musica: 'club', guion: 'formula' },
  { id: 'Vertical-Workout', formato: 'vertical', musica: 'workout', guion: 'formula' },
]

export function Root() {
  return (
    <>
      {VERSIONES.map((x) => {
        const f = FORMATOS[x.formato]
        return (
          <Composition
            key={x.id}
            id={x.id}
            component={Anuncio}
            durationInFrames={f.duracion * FPS}
            fps={FPS}
            width={f.ancho}
            height={f.alto}
            defaultProps={{ formato: x.formato, musica: x.musica, url: 'Muy pronto en web, Android e iPhone', guion: x.guion } satisfies PropsAnuncio}
          />
        )
      })}
      {([
        ['Vertical-Comunidad', 'vertical'],
        ['Horizontal-Comunidad', 'horizontal'],
        ['Vertical-Cupos', 'cupos'],
      ] as const).map(([id, version]) => {
        const f = FORMATOS[TIEMPOS[version].formato]
        return (
          <Composition
            key={id}
            id={id}
            component={AnuncioComunidad}
            durationInFrames={Math.round(TIEMPOS[version].duracion * FPS)}
            fps={FPS}
            width={f.ancho}
            height={f.alto}
            defaultProps={{ version, cupos: 20 } satisfies PropsComunidad}
          />
        )
      })}
      {IDS.map((id) => (
        <Composition
          key={id}
          id={`Etapa3-${VIDEOS[id].numero}-${id[0]!.toUpperCase()}${id.slice(1)}`}
          component={VideoEtapa3}
          durationInFrames={Math.round(VIDEOS[id].duracion * FPS)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ id, cupos: 20 } satisfies PropsEtapa3}
        />
      ))}
    </>
  )
}
