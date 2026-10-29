// Versiones del video: 2 formatos × 2 temas musicales con el primer guion, y la versión "Kaibu lo adapta gratis".
import { Composition } from 'remotion'
import { Anuncio, type PropsAnuncio } from './Anuncio'
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
    </>
  )
}
