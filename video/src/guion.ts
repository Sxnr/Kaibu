// Textos de cada versión del anuncio: "formula" (te cobran por una multiplicación)
// y "adapta" (te cobran por que tu plan se adapte; Kaibu lo adapta gratis).
import type { Parte } from './componentes'
import { C } from './tema'

export type Guion = 'formula' | 'adapta'

export interface Termino {
  t: string
  variable?: string
}

interface TextosGuion {
  /** Preguntas de la apertura, en orden: q1, q2 (solo horizontal), q3, q4, colegio, q6 y el remate tras el drop. */
  apertura: { q1: Parte[]; q2: Parte[]; q3: Parte[]; q4: Parte[]; colegio: Parte[]; q6: Parte[]; q7: Parte[] }
  cuenta: { etiqueta: string; terminos: Termino[]; lineasV: number[][]; objetivo: number; antes: string; despues: string }
  sello: { arriba: string; precio: string; abajo: string }
  progreso: { titulo: Parte[]; sub: string }
  cierre: Parte[]
}

export const GUIONES: Record<Guion, TextosGuion> = {
  formula: {
    apertura: {
      q1: [{ t: '¿Quieres comer' }, { t: 'equilibrado?', pildora: C.ambar, colorPildora: C.texto }],
      q2: [{ t: 'Primero…' }, { t: 'desbloquea tu plan.', color: C.tintaSuave }],
      q3: [{ t: '¿Pagar' }, { t: '$15.990 al mes', pildora: C.marca }],
      q4: [{ t: '…por una' }, { t: 'multiplicación?', pildora: C.ambar, colorPildora: C.texto }],
      colegio: [{ t: 'Es' }, { t: 'matemática de colegio.', pildora: C.cielo, colorPildora: C.texto }],
      q6: [{ t: 'Y aun así,' }, { t: 'te la cobran.', color: '#e8555c' }],
      q7: [{ t: 'Kaibu te la hace' }, { t: 'gratis.', pildora: C.marca }],
    },
    cuenta: {
      etiqueta: 'Tu gasto en reposo · Fórmula Mifflin-St Jeor (1990)',
      terminos: [
        { t: '10 ×' },
        { t: 'peso', variable: '70,5' },
        { t: '+ 6,25 ×' },
        { t: 'altura', variable: '165' },
        { t: '− 5 ×' },
        { t: 'edad', variable: '31' },
        { t: '− 161' },
      ],
      lineasV: [
        [0, 1],
        [2, 3],
        [4, 5, 6],
      ],
      objetivo: 1420,
      antes: '= ',
      despues: ' kcal',
    },
    sello: { arriba: 'PLAN PREMIUM', precio: '$15.990', abajo: 'AL MES' },
    progreso: {
      titulo: [{ t: 'Mira tu' }, { t: 'avance real.', pildora: C.verde, colorPildora: C.texto }],
      sub: 'Tu racha, tu promedio de 7 días y cuándo llegas a tu meta.',
    },
    cierre: [{ t: 'Deja de pagar por' }, { t: 'una multiplicación.', pildora: C.marca }],
  },
  adapta: {
    apertura: {
      q1: [{ t: '¿Llevas semanas' }, { t: 'sin bajar?', pildora: C.ambar, colorPildora: C.texto }],
      q2: [{ t: 'Tu plan' }, { t: 'no se adapta.', color: C.tintaSuave }],
      q3: [{ t: '¿Pagar' }, { t: '$61.900 al año', pildora: C.marca }],
      q4: [{ t: '…para que' }, { t: 'se adapte?', pildora: C.ambar, colorPildora: C.texto }],
      colegio: [{ t: 'Es' }, { t: 'un promedio y una resta.', pildora: C.cielo, colorPildora: C.texto }],
      q6: [{ t: 'Y aun así,' }, { t: 'te lo cobran.', color: '#e8555c' }],
      q7: [{ t: 'Kaibu lo adapta' }, { t: 'gratis.', pildora: C.marca }],
    },
    cuenta: {
      etiqueta: 'Tu ajuste semanal · promedio de 7 días',
      terminos: [
        { t: 'hoy', variable: '70,4' },
        { t: '−' },
        { t: 'hace 2 sem.', variable: '70,5' },
        { t: '=' },
        { t: 'ritmo', variable: '−0,1' },
        { t: 'kg' },
      ],
      lineasV: [
        [0, 1],
        [2, 3],
        [4, 5],
      ],
      objetivo: 150,
      antes: '→ −',
      despues: ' kcal al día',
    },
    sello: { arriba: 'PLAN ADAPTATIVO', precio: '$61.900', abajo: 'AL AÑO' },
    progreso: {
      titulo: [{ t: 'Tu plan se adapta' }, { t: 'cada semana.', pildora: C.verde, colorPildora: C.texto }],
      sub: 'Con tu promedio de 7 días y tu ritmo real. Tú decides si lo aceptas.',
    },
    cierre: [{ t: 'Deja de pagar por' }, { t: 'que tu plan se adapte.', pildora: C.marca }],
  },
}
