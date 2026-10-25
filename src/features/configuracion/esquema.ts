// Validación del cuestionario inicial (también se reutiliza al editar el perfil).
import { z } from 'zod'
import { calcularEdad } from '@/domain/calc/energia'
import { parseDecimal } from '@/domain/format/formato'

export const EDAD_MINIMA = 18

const numero = (min: number, max: number, mensaje: string) =>
  z.string().refine((v) => {
    const n = parseDecimal(v)
    return n !== null && n >= min && n <= max
  }, mensaje)

export const esquemaPerfil = z
  .object({
    nombre: z.string().trim().min(1, 'Escribe cómo quieres que te llamemos.').max(40, 'Máximo 40 caracteres.'),
    sexo: z.enum(['hombre', 'mujer'], { error: 'Elige una opción para calcular tu metabolismo.' }),
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige tu fecha de nacimiento.')
      .refine((f) => calcularEdad(f) >= EDAD_MINIMA, `Por ahora Kaibu es solo para personas de ${EDAD_MINIMA} años o más.`)
      .refine((f) => calcularEdad(f) <= 100, 'Revisa el año de tu fecha de nacimiento.'),
    estaturaCm: numero(120, 230, 'Escribe tu estatura en centímetros, entre 120 y 230 (ej. 172).'),
    pesoKg: numero(30, 300, 'Escribe tu peso en kilos, entre 30 y 300 (ej. 78,5).'),
    actividad: z.enum(['sedentario', 'ligero', 'activo'], { error: 'Elige la opción que más se parezca a tu día.' }),
    diasEntrenamiento: z.enum(['0', '1', '2', '3', '4', '5', '6', '7'], { error: 'Elige cuántos días entrenas.' }),
    objetivo: z.enum(['perder', 'mantener', 'ganar'], { error: 'Elige tu objetivo.' }),
    pesoMeta: z.string(),
    velocidad: z.enum(['lenta', 'recomendada', 'rapida']),
    numComidas: z.enum(['3', '4'], { error: 'Elige cuántas comidas haces al día.' }),
    colaciones: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.objetivo === 'mantener') return
    const meta = parseDecimal(d.pesoMeta)
    const actual = parseDecimal(d.pesoKg)
    if (meta === null || meta < 30 || meta > 300) {
      ctx.addIssue({ code: 'custom', path: ['pesoMeta'], message: 'Escribe tu peso meta en kilos (ej. 72).' })
      return
    }
    if (actual !== null && d.objetivo === 'perder' && meta >= actual) {
      ctx.addIssue({ code: 'custom', path: ['pesoMeta'], message: 'Para bajar grasa, la meta debe ser menor a tu peso actual.' })
    }
    if (actual !== null && d.objetivo === 'ganar' && meta <= actual) {
      ctx.addIssue({ code: 'custom', path: ['pesoMeta'], message: 'Para ganar músculo, la meta debe ser mayor a tu peso actual.' })
    }
  })

export type DatosPerfil = z.infer<typeof esquemaPerfil>

export const VALORES_INICIALES: Partial<DatosPerfil> = {
  nombre: '',
  fechaNacimiento: '',
  estaturaCm: '',
  pesoKg: '',
  pesoMeta: '',
  velocidad: 'recomendada',
  colaciones: false,
}
