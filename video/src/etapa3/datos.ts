// Etapa 3: 6 videos verticales con la voz de Francisco. Los tiempos (segundos) salen de su grabación,
// transcrita palabra por palabra; cada subtítulo empieza cuando empieza a decirlo.
import type { IdMusica } from '../ritmo'

export type IdVideo = 'arroz' | 'completo' | 'peso' | 'carne' | 'busco' | 'cazuela'

export interface Sub {
  desde: number
  texto: string
}

export interface DatosVideo {
  numero: number
  titulo: string
  voz: string
  musica: IdMusica
  /** Volumen de la música mientras habla (bajo). */
  musicaVoz: number
  /** Segundo en que empieza el cierre ("Postula a la beta…"). */
  cierre: number
  /** Duración total del video. */
  duracion: number
  subs: Sub[]
  /** Fin del último subtítulo. */
  finVoz: number
}

export const VIDEOS: Record<IdVideo, DatosVideo> = {
  arroz: {
    numero: 1,
    titulo: 'Arroz con pollo · cálculo en vivo',
    voz: 'voz/video1.m4a',
    musica: 'workout',
    musicaVoz: 0.13,
    cierre: 22.06,
    duracion: 28.6,
    finVoz: 25.6,
    subs: [
      { desde: 1.38, texto: 'Tu arroz con pollo' },
      { desde: 2.42, texto: 'no tiene las calorías que crees' },
      { desde: 4.18, texto: 'Un plato normal,' },
      { desde: 4.94, texto: 'arroz con pechuga,' },
      { desde: 6.02, texto: 'son 433 calorías' },
      { desde: 7.92, texto: 'y 41 g de proteína.' },
      { desde: 9.82, texto: 'Pero si le echaste' },
      { desde: 10.66, texto: 'una cucharada de aceite al sartén,' },
      { desde: 12.48, texto: 'súmale 124.' },
      { desde: 13.96, texto: 'Esa cucharada nadie la anota…' },
      { desde: 15.94, texto: '…y es la que te frena el déficit.' },
      { desde: 17.68, texto: 'En Kaibu guardas tu plato una vez' },
      { desde: 19.68, texto: 'y después lo anotas en un toque.' },
      { desde: 22.06, texto: 'Es chilena y gratis.' },
      { desde: 23.84, texto: 'Postula a la beta:' },
      { desde: 24.78, texto: 'link en el perfil.' },
    ],
  },
  completo: {
    numero: 2,
    titulo: 'Completo italiano · duelo',
    voz: 'voz/video2.m4a',
    musica: 'club',
    musicaVoz: 0.15,
    cierre: 21.66,
    duracion: 28,
    finVoz: 25.04,
    subs: [
      { desde: 1.22, texto: 'Un completo italiano' },
      { desde: 2.48, texto: 'tiene casi 500 calorías.' },
      { desde: 4.34, texto: '484, para ser exacto,' },
      { desde: 6.94, texto: 'y solo 11 g de proteína.' },
      { desde: 9.52, texto: 'Un plato de arroz con pollo' },
      { desde: 10.82, texto: 'tiene menos calorías' },
      { desde: 12.06, texto: 'y casi 4 veces más proteína.' },
      { desde: 14.42, texto: 'No digo que no te lo comas:' },
      { desde: 16.08, texto: 'digo que lo anotes.' },
      { desde: 17.52, texto: 'En Kaibu está el completo,' },
      { desde: 19.4, texto: 'la cazuela' },
      { desde: 20.32, texto: 'y hasta la chorrillana.' },
      { desde: 21.66, texto: 'App chilena y gratis.' },
      { desde: 23.12, texto: 'Postula a la beta:' },
      { desde: 24.22, texto: 'link en el perfil.' },
    ],
  },
  peso: {
    numero: 3,
    titulo: 'Tu peso te miente · el gráfico',
    voz: 'voz/video3.m4a',
    musica: 'club',
    musicaVoz: 0.1,
    cierre: 21.16,
    duracion: 26.4,
    finVoz: 23.22,
    subs: [
      { desde: 1.9, texto: '¿Llevas dos semanas sin bajar?' },
      { desde: 4.06, texto: 'Tu peso te está mintiendo.' },
      { desde: 5.58, texto: 'De un día a otro' },
      { desde: 6.52, texto: 'puedes subir o bajar más de un kilo' },
      { desde: 8.2, texto: 'solo por agua y sal.' },
      { desde: 9.84, texto: 'Si miras el número de cada mañana,' },
      { desde: 11.78, texto: 'te vas a frustrar.' },
      { desde: 13.06, texto: 'Lo que importa' },
      { desde: 14.12, texto: 'es el promedio de tus 7 días.' },
      { desde: 16.38, texto: 'Kaibu lo calcula solo' },
      { desde: 17.74, texto: 'y si de verdad te estancaste,' },
      { desde: 19.5, texto: 'te ajusta el plan gratis.' },
      { desde: 21.16, texto: 'Postula a la beta:' },
      { desde: 22.32, texto: 'link en el perfil.' },
    ],
  },
  carne: {
    numero: 4,
    titulo: 'Carne molida 5 % vs 10 % · quiz',
    voz: 'voz/video4.m4a',
    musica: 'workout',
    musicaVoz: 0.12,
    cierre: 31.06,
    duracion: 36.2,
    finVoz: 33.12,
    subs: [
      { desde: 0.76, texto: '¿Carne molida 5 % o 10 %?' },
      { desde: 3.92, texto: '¿Vale la pena pagar más?' },
      { desde: 5.82, texto: 'Una porción de 120 g cocida:' },
      { desde: 8.32, texto: 'la de 5 % tiene 197 calorías' },
      { desde: 12.0, texto: 'y la de 10 %, 260.' },
      { desde: 14.5, texto: 'La proteína es casi igual:' },
      { desde: 16.16, texto: '30 contra 31 gramos.' },
      { desde: 17.98, texto: 'Son 63 calorías de diferencia por porción.' },
      { desde: 20.72, texto: 'Si la comes 5 veces a la semana,' },
      { desde: 22.1, texto: 'son más de 300.' },
      { desde: 23.62, texto: 'En déficit, conviene la de 5 %.' },
      { desde: 25.88, texto: 'En volumen, da lo mismo:' },
      { desde: 27.62, texto: 'elige la más barata.' },
      { desde: 28.38, texto: 'Esto y más lo ves en Kaibu.' },
      { desde: 31.06, texto: 'Postula a la beta:' },
      { desde: 32.22, texto: 'link en el perfil.' },
    ],
  },
  busco: {
    numero: 5,
    titulo: 'Busco 20 personas · se busca',
    voz: 'voz/video5.m4a',
    musica: 'club',
    musicaVoz: 0.14,
    cierre: 22.88,
    duracion: 29.6,
    finVoz: 26.52,
    subs: [
      { desde: 1.36, texto: 'Estoy buscando 20 personas' },
      { desde: 2.98, texto: 'que entrenen para probar mi app.' },
      { desde: 5.1, texto: 'Me llamo Francisco' },
      { desde: 5.88, texto: 'y estoy haciendo Kaibu,' },
      { desde: 7.42, texto: 'una app chilena para contar calorías y proteína.' },
      { desde: 10.62, texto: 'Te calcula el plan,' },
      { desde: 11.64, texto: 'anotas en segundos' },
      { desde: 12.5, texto: 'y se ajusta cada semana con tu progreso.' },
      { desde: 15.32, texto: 'Busco gente que vaya al gimnasio,' },
      { desde: 17.34, texto: 'que quiera ordenarse con la comida' },
      { desde: 18.94, texto: 'y que me diga la verdad.' },
      { desde: 20.44, texto: 'Es gratis.' },
      { desde: 21.3, texto: 'Lo único que pido es tu opinión.' },
      { desde: 22.88, texto: 'Postula en el Discord:' },
      { desde: 23.8, texto: 'link en el perfil.' },
      { desde: 24.78, texto: 'Van quedando pocos cupos.' },
    ],
  },
  cazuela: {
    numero: 6,
    titulo: 'La cazuela · ráfaga',
    voz: 'voz/video6.m4a',
    musica: 'workout',
    musicaVoz: 0.15,
    cierre: 23.22,
    duracion: 28.8,
    finVoz: 25.9,
    subs: [
      { desde: 1.7, texto: 'Las apps gringas' },
      { desde: 2.48, texto: 'no conocen la cazuela.' },
      { desde: 4.2, texto: 'Así que hice una.' },
      { desde: 5.54, texto: 'Kaibu es chilena:' },
      { desde: 6.82, texto: 'tiene la cazuela,' },
      { desde: 7.8, texto: 'los porotos con riendas,' },
      { desde: 8.92, texto: 'el pastel de choclo…' },
      { desde: 10.34, texto: '…y también tu arroz con pollo,' },
      { desde: 12.06, texto: 'tu avena con proteína' },
      { desde: 14.88, texto: 'y los yogures con proteína del súper.' },
      { desde: 18.04, texto: 'Habla como nosotros:' },
      { desde: 19.52, texto: 'once, marraqueta, sopaipilla.' },
      { desde: 21.88, texto: 'Y es gratis.' },
      { desde: 23.22, texto: 'Postula a la beta:' },
      { desde: 24.88, texto: 'link en el perfil.' },
    ],
  },
}

export const IDS: IdVideo[] = ['arroz', 'completo', 'peso', 'carne', 'busco', 'cazuela']
