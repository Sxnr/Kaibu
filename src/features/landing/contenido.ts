// Textos de la landing. Solo describe funciones que existen; las de etapas futuras van como "Pronto".
import { Moon, ShieldCheck, Smartphone, UtensilsCrossed, WifiOff, type LucideIcon } from 'lucide-react'

export interface Funcion {
  icono: LucideIcon
  titulo: string
  texto: string
}

export const CONFIANZA: Funcion[] = [
  { icono: UtensilsCrossed, titulo: 'Hecha para Chile', texto: 'Marraqueta, once y colaciones' },
  { icono: WifiOff, titulo: 'Funciona sin internet', texto: 'Se sincroniza al volver' },
  { icono: ShieldCheck, titulo: 'Tus datos son tuyos', texto: 'Solo tú los ves' },
  { icono: Smartphone, titulo: 'Web y Android', texto: 'Misma cuenta, mismos datos' },
]

/** Bloques grandes que alternan texto y panel de color con una maqueta de la app. */
export interface Bloque {
  id: 'agregar' | 'plan' | 'progreso'
  rotulo: string
  titulo: string
  texto: string
  puntos: string[]
}

export const BLOQUES: Bloque[] = [
  {
    id: 'agregar',
    rotulo: 'Registrar',
    titulo: 'Anota una comida en menos de 10 segundos',
    texto: 'Tus recientes y favoritos aparecen a un toque. Copia el almuerzo de ayer o agrega rápido solo kcal y proteína cuando comes fuera.',
    puntos: ['Más de 100 alimentos chilenos con su fuente', 'Gramos, porciones o unidades', 'Todo se puede editar o deshacer'],
  },
  {
    id: 'plan',
    rotulo: 'Tu plan',
    titulo: 'Un plan por fases, con cada número explicado',
    texto: 'Déficit, mantención o volumen. Calculamos tus calorías, macros y reparto por comida según tu cuerpo, y te decimos de dónde sale cada valor.',
    puntos: ['Basado en la fórmula Mifflin-St Jeor', 'Rango aceptable de ±10 %', 'Lo ajustas a mano cuando quieras'],
  },
  {
    id: 'progreso',
    rotulo: 'Progreso',
    titulo: 'Tu avance real, sin el ruido del día a día',
    texto: 'El promedio de 7 días de tu peso muestra hacia dónde vas de verdad. Ves tu ritmo, el porcentaje logrado y cuándo llegarías a tu meta.',
    puntos: ['Promedio móvil de 7 días', 'Ritmo real vs. planeado', 'Fecha estimada de llegada'],
  },
]

export const FUNCIONES: Funcion[] = [
  {
    icono: UtensilsCrossed,
    titulo: 'Alimentos chilenos',
    texto: 'Marraqueta, hallulla, porotos, quesillo… y tus propios alimentos privados.',
  },
  {
    icono: WifiOff,
    titulo: 'Sin conexión',
    texto: 'Registra en el gimnasio o en el metro. Se sincroniza solo al volver internet.',
  },
  {
    icono: Moon,
    titulo: 'Claro u oscuro',
    texto: 'Se adapta a tu sistema, a tu tamaño de letra y a "reducir movimiento".',
  },
]

export const PRONTO = ['Escáner de código de barras', 'Fotos de progreso', 'Gym con progresión', 'Agua y suplementos', 'Recordatorios', 'Coach con IA']

export const PASOS = [
  { titulo: 'Cuéntanos de ti', texto: 'Un minuto de preguntas: estatura, peso, actividad y tu objetivo.' },
  { titulo: 'Recibe tu plan', texto: 'Kcal, proteína, carbos y grasas para tu fase, con la explicación de cada valor.' },
  { titulo: 'Registra y avanza', texto: 'Anota tus comidas y tu peso. Kaibu ajusta el plan según tu ritmo real.' },
]

export const PRIVACIDAD = [
  'Solo tú puedes ver tus registros: cada dato está protegido por usuario.',
  'Te pedimos permiso explícito para tratar tus datos de salud.',
  'Sin publicidad y sin venta de datos.',
  'Siempre podrás descargar o borrar tu información.',
]
