// Ritmo del video: cada corte cae en un golpe de la música y el logo aparece justo en el "drop".

export const FPS = 30

export type IdMusica = 'club' | 'workout'
export type Formato = 'horizontal' | 'vertical'

interface Musica {
  nombre: string
  archivo: string
  bpm: number
  /** Segundo exacto del "drop" dentro del tema (medido con el análisis de energía). */
  drop: number
}

export const MUSICAS: Record<IdMusica, Musica> = {
  club: { nombre: 'Club Music', archivo: 'musica/club.mp3', bpm: 117.75, drop: 16.35 },
  workout: { nombre: 'Workout', archivo: 'musica/workout.mp3', bpm: 159.65, drop: 19.96 },
}

export const FORMATOS: Record<Formato, { ancho: number; alto: number; duracion: number; drop: number }> = {
  horizontal: { ancho: 1920, alto: 1080, duracion: 60, drop: 14 },
  vertical: { ancho: 1080, alto: 1920, duracion: 30, drop: 7 },
}

export type IdSeccion = 'apertura' | 'plan' | 'registrar' | 'progreso' | 'beneficios' | 'cierre'

/** Fin de cada sección (segundos del video, antes de ajustar al golpe). */
const CORTES: Record<Formato, Record<IdSeccion, number>> = {
  horizontal: { apertura: 18, plan: 27, registrar: 36, progreso: 45, beneficios: 52, cierre: 60 },
  vertical: { apertura: 9.5, plan: 14.5, registrar: 19, progreso: 23.5, beneficios: 26.5, cierre: 30 },
}

export interface Seccion {
  id: IdSeccion
  desde: number
  dur: number
}

export interface Ritmo {
  formato: Formato
  /** Duración de un pulso en segundos (en temas rápidos, cada 2 golpes). */
  pulso: number
  dropFrame: number
  /** Segundo del tema donde empieza el video. */
  inicioMusica: number
  /** Ajusta un instante (segundos del video) al pulso más cercano y lo devuelve en frames. */
  f: (segundos: number) => number
  /** 1 justo en cada golpe y baja rápido (sirve para "latir" con la música). */
  latido: (frame: number) => number
  secciones: Seccion[]
  total: number
}

export function crearRitmo(formato: Formato, idMusica: IdMusica): Ritmo {
  const m = MUSICAS[idMusica]
  const fm = FORMATOS[formato]
  const golpe = 60 / m.bpm
  const pulso = m.bpm > 140 ? golpe * 2 : golpe
  const ajustar = (t: number) => fm.drop + Math.round((t - fm.drop) / pulso) * pulso
  const f = (t: number) => Math.round(ajustar(t) * FPS)
  const total = fm.duracion * FPS

  const ids = Object.keys(CORTES[formato]) as IdSeccion[]
  let desde = 0
  const secciones = ids.map((id) => {
    const fin = id === 'cierre' ? total : f(CORTES[formato][id])
    const s = { id, desde, dur: fin - desde }
    desde = fin
    return s
  })

  return {
    formato,
    pulso,
    dropFrame: Math.round(fm.drop * FPS),
    inicioMusica: m.drop - fm.drop,
    f,
    latido: (frame) => {
      const t = frame / FPS - fm.drop
      const desdeGolpe = ((t % pulso) + pulso) % pulso
      return Math.exp(-desdeGolpe * 9)
    },
    secciones,
    total,
  }
}
