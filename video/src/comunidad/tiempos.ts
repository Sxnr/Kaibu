// Video de la comunidad: cada escena dura lo que dura su frase.
// Sin voz, los tiempos son estimados (ritmo de presentador). Cuando llegue la voz de Francisco,
// se reemplaza "desde" con el segundo exacto en que empieza cada frase en su grabación.
import type { Formato } from '../ritmo'

export type IdEscena = 'pregunta' | 'cobran' | 'plan' | 'registrar' | 'ajuste' | 'discord' | 'comparte' | 'cta'

export interface Linea {
  escena: IdEscena
  /** Segundo del video en que empieza la frase. */
  desde: number
  /** Subtítulo (lo que dice la voz). */
  texto: string
}

export interface TiemposFormato {
  lineas: Linea[]
  duracion: number
  /** Segundo del video donde cae el "drop" de la música (aparece Kaibu). */
  drop: number
  /** Archivo de voz en public/ (null mientras no exista). */
  voz: string | null
}

export const TIEMPOS: Record<Formato, TiemposFormato> = {
  vertical: {
    duracion: 30,
    drop: 3.4,
    voz: null,
    lineas: [
      { escena: 'pregunta', desde: 0, texto: '¿Te cuesta mantener tu alimentación cuando lo haces solo?' },
      { escena: 'plan', desde: 3.4, texto: 'Conoce Kaibu, la app chilena que calcula tu plan…' },
      { escena: 'registrar', desde: 6.8, texto: '…te deja anotar tus comidas en segundos, con cazuela y completo incluidos…' },
      { escena: 'ajuste', desde: 10.8, texto: '…y lo ajusta gratis cada semana con tu progreso real.' },
      { escena: 'discord', desde: 14.4, texto: 'Y no vas solo: únete a la comunidad de Kaibu en Discord.' },
      { escena: 'comparte', desde: 18.2, texto: 'Comparte tu semana, sube tu racha y postula a la beta.' },
      { escena: 'cta', desde: 22.2, texto: 'El link está en pantalla.' },
    ],
  },
  horizontal: {
    duracion: 45,
    drop: 6.6,
    voz: null,
    lineas: [
      { escena: 'pregunta', desde: 0, texto: '¿Te cuesta mantener tu alimentación cuando lo haces solo?' },
      { escena: 'cobran', desde: 3.6, texto: 'Te cobran por que tu plan se adapte a ti. En Kaibu, eso es gratis.' },
      { escena: 'plan', desde: 8.6, texto: 'Kaibu es la app chilena que calcula tus calorías y tu proteína según tu cuerpo, y te explica cada número.' },
      { escena: 'registrar', desde: 14.8, texto: 'Anotas tus comidas en segundos: cazuela, completo, marraqueta y miles de productos del súper.' },
      { escena: 'ajuste', desde: 20.6, texto: 'Cada semana mira tu promedio real y ajusta tu plan, sin cobrarte nada.' },
      { escena: 'discord', desde: 25.4, texto: 'Y no vas solo: en la comunidad de Kaibu en Discord…' },
      { escena: 'comparte', desde: 28.8, texto: '…compartes tu semana, subes tu racha y puedes postular a la beta.' },
      { escena: 'cta', desde: 33.2, texto: 'Entra con el link o escanea el código.' },
    ],
  },
}

export const INVITACION = 'discord.gg/xeyuq4M2rP'

export interface Tramo {
  escena: IdEscena
  desde: number
  dur: number
  texto: string
}

/** Tramo de cada escena en frames: desde su frase hasta la siguiente (la última, hasta el final). */
export function tramos(t: TiemposFormato, fps: number): Tramo[] {
  return t.lineas.map((l, i) => {
    const desde = Math.round(l.desde * fps)
    const hasta = Math.round((t.lineas[i + 1]?.desde ?? t.duracion) * fps)
    return { escena: l.escena, desde, dur: hasta - desde, texto: l.texto }
  })
}
