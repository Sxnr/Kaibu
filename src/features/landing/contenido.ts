// Textos de la landing. Solo describe funciones que existen; lo de etapas futuras va como "Pronto".

export const PASOS = [
  {
    titulo: 'Tu plan, explicado',
    texto: 'Respondes unas preguntas y recibes tus calorías, proteína, carbos, grasas y agua, con el cálculo de cada número a la vista.',
  },
  {
    titulo: 'Anota en segundos',
    texto: 'Catálogo chileno, recientes, favoritos y "copiar ayer". Funciona sin internet y se sincroniza al volver la señal.',
  },
  {
    titulo: 'Se adapta solo',
    texto: 'Cada semana mira tu promedio de 7 días y te sugiere un ajuste pequeño. Tú decides si lo aceptas.',
  },
]

export interface Plan {
  nombre: string
  etiqueta: string
  precio: string
  periodo?: string
  puntos: string[]
  nota?: string
  destacado?: boolean
}

export const PLANES: Plan[] = [
  {
    nombre: 'Gratis',
    etiqueta: 'Siempre',
    precio: '$0',
    puntos: ['Plan de kcal y macros explicado', 'Registro ilimitado y sin internet', 'Ajuste semanal con tu promedio', 'Progreso, rachas y gráfico de peso'],
  },
  {
    nombre: 'Kaibu+',
    etiqueta: 'Pronto',
    precio: '$2.490',
    periodo: 'al mes',
    puntos: ['Todo lo gratis', 'Anota por texto, voz o foto con IA', 'Coach IA para tus dudas del día'],
    nota: 'O $19.990 al año.',
    destacado: true,
  },
  {
    nombre: 'Profesional',
    etiqueta: 'Pronto',
    precio: 'A medida',
    puntos: ['Para nutricionistas, entrenadores y gimnasios', 'Resumen semanal de cada persona, con su permiso'],
  },
]

export const PREGUNTAS = [
  {
    pregunta: '¿De verdad es gratis?',
    respuesta:
      'Sí. El plan, el registro de comidas, el ajuste semanal y el progreso son gratis para siempre. Solo las funciones con inteligencia artificial serán de pago (Kaibu+).',
  },
  {
    pregunta: '¿Cómo calcula mis calorías?',
    respuesta: 'Con la fórmula Mifflin-St Jeor, tu nivel de actividad y tu objetivo. Cada número muestra su cálculo y puedes ajustarlo a mano.',
  },
  {
    pregunta: '¿Qué es el ajuste semanal?',
    respuesta:
      'Kaibu compara tu promedio de 7 días con lo planeado. Si vas más lento o más rápido, te propone un cambio pequeño de kcal que tú aceptas o rechazas.',
  },
  {
    pregunta: '¿Funciona en mi celular?',
    respuesta:
      'Hoy funciona en el navegador de cualquier celular o computador, incluso sin internet. Las apps para Android e iPhone llegan más adelante.',
  },
]

/** Privacidad: va como bloque propio porque es lo primero que preguntan con datos de salud. */
export const PRIVACIDAD = [
  'Solo tú puedes ver tus registros: cada dato está protegido por usuario.',
  'Te pedimos permiso explícito para tratar tus datos de salud.',
  'Sin publicidad y sin venta de datos.',
  'Siempre podrás descargar o borrar tu información.',
]
