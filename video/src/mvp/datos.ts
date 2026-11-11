// Video del MVP para Start-Up Chile: tiempos de la voz de Francisco y de la grabación real de la app.
// voz: segundos en el audio (public/voz/mvp.m4a, transcrito con marcas por palabra).
// rec: segundos en la grabación (public/mvp/recorrido.mp4, hecha con Playwright en modo local y datos de prueba).

export interface Escena {
  id: string
  menu: string
  voz: [number, number]
  rec: [number, number]
  dato: string
  detalle: string
  /** Acercamiento dentro de la pantalla del celular (opcional). */
  zoom?: { escala: number; x: number; y: number }
}

export const ESCENAS: Escena[] = [
  { id: 'portada', menu: 'Kaibu hoy', voz: [1.76, 6.02], rec: [1.07, 5.78], dato: 'Web + Android', detalle: 'beta funcionando' },
  { id: 'cuenta', menu: 'Crea tu cuenta', voz: [6.02, 13.58], rec: [5.79, 19.45], dato: '11 preguntas', detalle: 'menos de 1 minuto' },
  { id: 'plan', menu: 'Tu plan', voz: [13.58, 20.38], rec: [19.45, 26.49], dato: 'Mifflin-St Jeor', detalle: 'calorías y proteína a tu medida', zoom: { escala: 1.5, x: 50, y: 22 } },
  { id: 'agregar', menu: 'Anota rápido', voz: [20.38, 26.1], rec: [26.49, 32.66], dato: 'Segundos', detalle: 'para anotar una comida' },
  { id: 'catalogo', menu: 'Catálogo chileno', voz: [26.1, 30.82], rec: [32.66, 41.04], dato: '5.470', detalle: 'alimentos chilenos, marcas y platos' },
  { id: 'hoy', menu: 'Tu día', voz: [30.82, 36.86], rec: [41.04, 47.36], dato: 'Tu día', detalle: 'calorías, proteína y agua' },
  { id: 'peso', menu: 'Tu progreso', voz: [36.86, 44.98], rec: [47.36, 56.06], dato: '−0,50 kg/sem', detalle: 'ritmo real vs. esperado', zoom: { escala: 1.35, x: 50, y: 45 } },
  { id: 'offline', menu: 'Sin internet', voz: [44.98, 50.4], rec: [56.06, 62.65], dato: 'Sin internet', detalle: 'se sincroniza al volver' },
  { id: 'comunidad', menu: 'Comunidad', voz: [50.4, 54.4], rec: [62.65, 67.0], dato: 'Discord', detalle: 'desafíos, reportes y novedades' },
]

/** Desde aquí habla del cierre (beta y Google Play). */
export const INICIO_CIERRE = 54.4
export const FIN_VOZ = 61.46
export const DURACION = 65

export const SUBTITULOS: [number, number, string][] = [
  [1.76, 5.7, 'Esta es Kaibu funcionando hoy, en su beta para la web y Android.'],
  [6.02, 8.4, 'La persona crea su cuenta con su código de la beta'],
  [8.4, 12.9, 'y responde 11 preguntas rápidas: edad, estatura, peso, actividad y su objetivo.'],
  [13.58, 17.3, 'Con eso, Kaibu calcula sus calorías y proteína'],
  [17.3, 19.9, 'con la fórmula de Mifflin-St Jeor y se lo explica en simple.'],
  [20.38, 23.3, 'Anotar es la parte más importante, por eso es rápido.'],
  [23.48, 25.95, 'Busco marraqueta, elijo la porción y listo.'],
  [26.1, 30.2, 'El catálogo tiene más de 5.000 alimentos chilenos, marcas de supermercado y platos caseros.'],
  [30.82, 34.5, 'Hoy veo cuánto me queda del día, la proteína y el agua.'],
  [34.68, 36.7, 'Al final del día lo cierro con un toque.'],
  [36.86, 38.6, 'Cada semana registro mi peso.'],
  [38.68, 41.84, 'Kaibu compara mi ritmo real con el esperado'],
  [41.84, 44.3, 'y me propone ajustar la meta, como lo haría un nutricionista.'],
  [44.72, 47.5, 'Y funciona sin internet: todo se guarda en el celular'],
  [47.5, 50.0, 'y se sincroniza cuando vuelve la conexión.'],
  [50.4, 54.0, 'Además, tiene una comunidad en Discord con desafíos, reportes y novedades.'],
  [54.4, 57.3, 'Hoy se encuentra en la beta privada con usuarios reales'],
  [57.42, 61.6, 'y con Start-Up Chile queremos lanzarla en Google Play y otras plataformas.'],
]

export const MUSICA = { archivo: 'musica/e3-raving-energy.mp3', volumen: 0.11 }
