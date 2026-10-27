// Las 4 versiones del video: 2 formatos × 2 temas musicales.
import { Composition } from 'remotion'
import { Anuncio, type PropsAnuncio } from './Anuncio'
import { FORMATOS, FPS, type Formato, type IdMusica } from './ritmo'
import './tema'

const VERSIONES: { id: string; formato: Formato; musica: IdMusica }[] = [
  { id: 'Horizontal-Club', formato: 'horizontal', musica: 'club' },
  { id: 'Horizontal-Workout', formato: 'horizontal', musica: 'workout' },
  { id: 'Vertical-Club', formato: 'vertical', musica: 'club' },
  { id: 'Vertical-Workout', formato: 'vertical', musica: 'workout' },
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
            defaultProps={{ formato: x.formato, musica: x.musica, url: 'Muy pronto en web y Android' } satisfies PropsAnuncio}
          />
        )
      })}
    </>
  )
}
