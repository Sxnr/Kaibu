import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import type { Perfil } from '@/data/db'
import { guardar } from '@/data/escritura'
import type { PlanCalculado } from '@/domain/calc/plan'
import { formatoNumero, parseDecimal } from '@/domain/format/formato'

const rango = (min: number, max: number, msg: string) =>
  z.string().refine((v) => {
    const n = parseDecimal(v)
    return n !== null && n >= min && n <= max
  }, msg)

const esquema = z
  .object({
    kcal: rango(800, 6000, 'Escribe una meta entre 800 y 6.000 kcal.'),
    proteina: rango(1.6, 2.4, 'La proteína debe estar entre 1,6 y 2,4 g por kg.'),
    agua: rango(0.5, 8, 'Escribe una meta de agua entre 0,5 y 8 litros.'),
    comidas: z.array(z.object({ id: z.string(), nombre: z.string(), pct: rango(0, 100, 'Entre 0 y 100.') })),
  })
  .refine((d) => Math.abs(d.comidas.reduce((s, c) => s + (parseDecimal(c.pct) ?? 0), 0) - 100) < 0.01, {
    path: ['comidas'],
    message: 'El reparto debe sumar 100 %.',
  })
type Datos = z.infer<typeof esquema>

interface Props {
  abierta: boolean
  alCambiar: (v: boolean) => void
  perfil: Perfil
  plan: PlanCalculado
}

/** Ajuste manual del plan: meta de kcal, proteína, agua y reparto por comida. */
export function AjustarPlan({ abierta, alCambiar, perfil, plan }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    values: {
      kcal: String(plan.kcal),
      proteina: formatoNumero(plan.proteinaGKg, 1),
      agua: formatoNumero(plan.aguaMl / 1000, 1),
      comidas: plan.comidas.map((c) => ({ id: c.id, nombre: c.nombre, pct: String(c.pct) })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'comidas' })
  const suma = watch('comidas').reduce((s, c) => s + (parseDecimal(c.pct) ?? 0), 0)

  const enviar = handleSubmit(async (d) => {
    await guardar('perfiles', {
      ...perfil,
      kcalManual: Math.round(parseDecimal(d.kcal)!),
      proteinaGKg: parseDecimal(d.proteina)!,
      aguaMetaMl: Math.round(parseDecimal(d.agua)! * 1000),
      comidas: d.comidas.map((c) => ({ id: c.id, nombre: c.nombre, pct: parseDecimal(c.pct)! })),
    })
    toast.success('Plan actualizado')
    alCambiar(false)
  })

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo="Ajustar a mano" descripcion="Tus cambios se respetan hasta que pidas recalcular.">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Meta diaria (kcal)" error={errors.kcal?.message} ayuda={`Calculada: ${formatoNumero(plan.mantenimiento + plan.ajuste)} kcal.`}>
          {(a) => <Entrada inputMode="numeric" {...a} {...register('kcal')} />}
        </Campo>
        <Campo etiqueta="Proteína (g por kg de peso)" error={errors.proteina?.message} ayuda="Entre 1,6 y 2,4.">
          {(a) => <Entrada inputMode="decimal" {...a} {...register('proteina')} />}
        </Campo>
        <Campo etiqueta="Agua (litros al día)" error={errors.agua?.message}>
          {(a) => <Entrada inputMode="decimal" {...a} {...register('agua')} />}
        </Campo>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Reparto por comida (%)</legend>
          {fields.map((f, i) => (
            <Campo key={f.id} etiqueta={f.nombre} error={errors.comidas?.[i]?.pct?.message} className="grid grid-cols-[1fr_6rem] items-center gap-x-3">
              {(a) => <Entrada inputMode="decimal" className="text-right" {...a} {...register(`comidas.${i}.pct`)} />}
            </Campo>
          ))}
          <p className={Math.abs(suma - 100) < 0.01 ? 'text-sm text-texto-secundario' : 'text-sm font-medium text-texto-marca'} role="status">
            Suma: <span className="num">{formatoNumero(suma, 0)}</span> % {Math.abs(suma - 100) < 0.01 ? '· Correcto' : '· Debe sumar 100 %'}
          </p>
          {errors.comidas?.root?.message && (
            <p role="alert" className="text-sm font-medium text-texto-marca">
              {errors.comidas.root.message}
            </p>
          )}
        </fieldset>
        <Boton type="submit" ancho="completo" disabled={isSubmitting}>
          Guardar ajustes
        </Boton>
      </form>
    </Hoja>
  )
}
