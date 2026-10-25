import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { parseDecimal } from '@/domain/format/formato'

const esquema = z.object({
  nombre: z.string().max(120, 'Máximo 120 caracteres.'),
  kcal: z.string().refine((v) => {
    const n = parseDecimal(v)
    return n !== null && n > 0 && n <= 10000
  }, 'Escribe las kcal (entre 1 y 10.000).'),
  proteina: z.string().refine((v) => v.trim() === '' || ((parseDecimal(v) ?? -1) >= 0 && (parseDecimal(v) ?? 0) <= 1000), 'Escribe los gramos de proteína (o déjalo vacío).'),
})
type Datos = z.infer<typeof esquema>

interface Props {
  abierta: boolean
  alCambiar: (v: boolean) => void
  nombreComida: string
  alGuardar: (kcal: number, proteina: number, nombre: string) => void
}

/** "Agregar rápido": solo kcal y proteína. */
export function AgregarRapido({ abierta, alCambiar, nombreComida, alGuardar }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Datos>({ resolver: zodResolver(esquema), defaultValues: { nombre: '', kcal: '', proteina: '' } })

  const enviar = handleSubmit((d) => {
    alGuardar(parseDecimal(d.kcal)!, parseDecimal(d.proteina) ?? 0, d.nombre)
    reset()
  })

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo="Agregar rápido" descripcion="Cuando solo sabes las calorías y la proteína.">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Kcal" error={errors.kcal?.message}>
            {(a) => <Entrada inputMode="numeric" className="num text-2xl" {...a} {...register('kcal')} />}
          </Campo>
          <Campo etiqueta="Proteína (g)" error={errors.proteina?.message}>
            {(a) => <Entrada inputMode="decimal" className="num text-2xl" {...a} {...register('proteina')} />}
          </Campo>
        </div>
        <Campo etiqueta="Nombre (opcional)" error={errors.nombre?.message}>
          {(a) => <Entrada placeholder="Ej. Completo italiano" {...a} {...register('nombre')} />}
        </Campo>
        <Boton type="submit" ancho="completo">
          Agregar a {nombreComida}
        </Boton>
      </form>
    </Hoja>
  )
}
