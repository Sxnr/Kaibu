import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { db, type Peso } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { fechaLarga, formatoNumero, hoyISO, parseDecimal } from '@/domain/format/formato'
import { vibrar } from '@/lib/utils'

const esquema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha.').refine((f) => f <= hoyISO(), 'No puedes registrar un peso en el futuro.'),
  kg: z.string().refine((v) => {
    const n = parseDecimal(v)
    return n !== null && n >= 25 && n <= 350
  }, 'Escribe tu peso en kilos, entre 25 y 350 (ej. 78,4).'),
})
type Datos = z.infer<typeof esquema>

interface Props {
  abierta: boolean
  alCambiar: (v: boolean) => void
  userId: string
  /** Peso existente a editar (si no, se registra uno nuevo). */
  existente?: Peso | null
  fechaInicial?: string
}

/** Registro rápido del peso en ayunas. Un peso por día: si ya existe, se reemplaza. */
export function RegistrarPeso({ abierta, alCambiar, userId, existente, fechaInicial }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    values: {
      fecha: existente?.fecha ?? fechaInicial ?? hoyISO(),
      kg: existente ? formatoNumero(existente.kg, 1) : '',
    },
  })

  const enviar = handleSubmit(async ({ fecha, kg }) => {
    const anterior = await db.pesos.get([userId, fecha])
    const nuevo = await guardar('pesos', { userId, fecha, kg: parseDecimal(kg)!, updatedAt: '', deletedAt: null })
    if (existente && existente.fecha !== fecha) await borrar('pesos', existente)
    vibrar()
    alCambiar(false)
    toast(`Peso guardado: ${formatoNumero(nuevo.kg, 1)} kg`, {
      description: fechaLarga(fecha),
      action: {
        label: 'Deshacer',
        onClick: () => {
          void (async () => {
            if (anterior && anterior.deletedAt === null) await guardar('pesos', anterior)
            else await borrar('pesos', nuevo)
            if (existente && existente.fecha !== fecha) await guardar('pesos', { ...existente, deletedAt: null })
          })()
        },
      },
    })
  })

  const eliminar = async (p: Peso) => {
    await borrar('pesos', p)
    alCambiar(false)
    toast(`Borraste el peso del ${fechaLarga(p.fecha)}`, {
      action: { label: 'Deshacer', onClick: () => void guardar('pesos', { ...p, deletedAt: null }) },
    })
  }

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo={existente ? 'Editar peso' : 'Registrar peso'} descripcion="Idealmente en ayunas, después de ir al baño.">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Peso (kg)" error={errors.kg?.message}>
          {(a) => <Entrada inputMode="decimal" placeholder="Ej. 78,4" className="num text-2xl" {...a} {...register('kg')} />}
        </Campo>
        <Campo etiqueta="Fecha" error={errors.fecha?.message}>
          {(a) => <Entrada type="date" max={hoyISO()} {...a} {...register('fecha')} />}
        </Campo>
        <div className="flex gap-3">
          {existente && (
            <Boton variante="peligro" onClick={() => void eliminar(existente)}>
              <Trash2 aria-hidden /> Borrar
            </Boton>
          )}
          <Boton type="submit" ancho="completo" disabled={isSubmitting}>
            Guardar peso
          </Boton>
        </div>
      </form>
    </Hoja>
  )
}
