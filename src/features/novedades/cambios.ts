// Apartado "Novedades": qué trae cada versión de Kaibu, en palabras simples. La primera es la actual.

export interface Version {
  version: string
  fecha: string
  titulo: string
  /** true solo en versiones grandes: el bot de Discord la anuncia una vez en #novedades. Los cambios chicos no se anuncian. */
  anunciar?: boolean
  cambios: string[]
}

export const CAMBIOS: Version[] = [
  {
    version: '0.2.2-beta',
    fecha: '2026-11-08',
    titulo: 'Kaibu para Android',
    anunciar: true,
    cambios: [
      'Kaibu ya es app para Android: abre al tiro, sin Chrome, y funciona sin internet.',
      'Descárgala gratis en kaibu-nine.vercel.app/descargar/android (Android 7 o superior).',
      'Se instala encima de la versión anterior sin perder nada, y la app te avisa cuando hay una nueva.',
      'Entrar con Google abre la pestaña segura de Google y vuelve directo a la app.',
      'Para crear tu cuenta sigues necesitando tu código de la beta.',
      'Arreglado: entrar desde un celular nuevo ya no puede borrar los datos de tu perfil.',
    ],
  },
  {
    version: '0.2.1-beta',
    fecha: '2026-11-07',
    titulo: 'Catálogo ampliado',
    cambios: [
      'Platos fit listos para anotar: arroz con pollo, avena con whey, bowls y más, con la receta a la vista.',
      'Lácteos con proteína, leches, jugos, proteínas en polvo y barras del súper y del gym.',
      'Comida de otros países: arepas, harina de maíz precocida, tacos, sushi, ramen y mucho más.',
      'Cadenas de comida rápida (McDonald’s, Burger King, KFC, Subway y pizzerías), con su receta de EE. UU.',
      'Búsqueda más inteligente: entiende yogur o yogurt, proteína o protein, porotos o frijoles, y busca por marca.',
    ],
  },
  {
    version: '0.2.0-beta',
    fecha: '2026-11-03',
    titulo: 'Beta privada',
    cambios: [
      'Agua del día con un toque por vaso, y el tamaño del vaso en Ajustes.',
      'Nota del día para anotar cómo te sentiste o qué entrenaste.',
      'Tu semana y tu mes en Progreso: días que cumpliste tus kcal y tu proteína, y tus promedios.',
      'Compartir tu semana como imagen para historias (tu peso solo aparece si lo activas).',
      'Tutorial guiado la primera vez; lo puedes volver a ver desde Más o Ajustes.',
      'Catálogo mucho más grande: cientos de comidas chilenas y miles de productos con marca.',
      'Mis datos: descarga todo en JSON o Excel, o borra tu cuenta cuando quieras.',
      'Documentos legales con fecha de versión y aviso cuando cambian.',
      'Kaibu para Android (APK) y nueva página de inicio.',
      'Comunidad: únete al Discord de Kaibu, vincula tu cuenta para tener roles por racha y envía reportes o sugerencias desde la app.',
      'Comunidad conectada: publica tu semana en el Discord, recordatorio opcional a las 21:00 y aviso cuando el equipo responde tus ideas.',
    ],
  },
  {
    version: '0.1.0',
    fecha: '2026-10-29',
    titulo: 'Primera versión',
    cambios: [
      'Tu plan por fases: kcal, proteína, carbos y grasas calculados para ti.',
      'Registro de comidas con búsqueda, recientes, favoritos y agregar rápido.',
      'Peso con promedio de 7 días, gráfico y ritmo real.',
      'Ajuste semanal de tu meta, avisos de seguridad y cambio de fase.',
      'Funciona sin internet y se sincroniza cuando vuelve la conexión.',
    ],
  },
]

/** Lo que viene, para que la beta sepa qué está en camino. */
export const EN_CAMINO: string[] = [
  'Tus propias recetas: arma tu arroz con pollo con tus gramos y guárdalo; también lista de compras.',
  'Recordatorios para anotar tus comidas y tomar agua, con horario de silencio.',
  'Suplementos: whey, creatina y otros, con dosis y horario.',
  'Fotos de progreso privadas y medidas (cintura, pecho, brazo y muslo).',
  'Micronutrientes: fibra, azúcar y sodio primero.',
  'Escanear el código de barras de un producto y ver sus sellos ALTO EN.',
  'Anotar con la voz, gratis: di "dos huevos y una marraqueta con palta" y revisa antes de guardar.',
]

export const CLAVE_VERSION_VISTA = 'kaibu:version-vista'

/** "0.2.0-beta" → "0.2.0 · beta". */
export function versionLegible(version: string): string {
  const [base, etiqueta] = version.split('-')
  return etiqueta ? `${base} · ${etiqueta}` : version
}

/** Se avisa una vez por versión, y nunca la primera vez que se abre la app (ahí está el tutorial). */
export function debeAvisarNovedades(vista: string | null, actual: string): boolean {
  return vista !== null && vista !== actual
}
