// Textos de la landing. Solo describe funciones que existen; las de etapas futuras van como "Pronto".
import { ChartLine, Clock3, Moon, ShieldCheck, Smartphone, Target, UtensilsCrossed, WifiOff, type LucideIcon } from 'lucide-react'

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

export const FUNCIONES: Funcion[] = [
  {
    icono: Clock3,
    titulo: 'Registra en segundos',
    texto: 'Recientes y favoritos a un toque, copia lo de ayer o agrega rápido solo kcal y proteína.',
  },
  {
    icono: Target,
    titulo: 'Un plan por fases',
    texto: 'Déficit, mantención o volumen. Calculamos tus kcal, macros y reparto por comida, y te explicamos cada número.',
  },
  {
    icono: ChartLine,
    titulo: 'Progreso real',
    texto: 'El promedio de 7 días de tu peso muestra tu avance sin el ruido del día a día, con fecha estimada de llegada.',
  },
  {
    icono: UtensilsCrossed,
    titulo: 'Alimentos chilenos',
    texto: 'Más de 100 alimentos comunes con su fuente, y tus propios alimentos privados.',
  },
  {
    icono: WifiOff,
    titulo: 'Sin conexión',
    texto: 'Registra en el gimnasio o en el metro. Todo se guarda en tu teléfono y se sincroniza solo.',
  },
  {
    icono: Moon,
    titulo: 'Claro u oscuro',
    texto: 'Se adapta a tu sistema, a tu letra y a "reducir movimiento". Pensada para usarse con una mano.',
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
