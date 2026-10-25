import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Trash2, TriangleAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useMisAlimentos } from '@/data/consultas'
import { ahoraISO, nuevoId, type MiAlimento } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { validarCoherenciaKcal } from '@/domain/calc/dia'
import { formatoNumero, parseDecimal } from '@/domain/format/formato'

const n = (min: number, max: number, msg: string, opcional = false) =>
  z.string().refine((v) => {
    if (opcional && v.trim() === '') return true
    const x = parseDecimal(v)
    return x !== null && x >= min && x <= max
  }, msg)

const esquema = z
  .object({
    nombre: z.string().trim().min(1, 'Escribe el nombre del alimento.').max(120, 'Máximo 120 caracteres.'),
    marca: z.string().trim().max(80, 'Máximo 80 caracteres.'),
    kcal: n(0, 900, 'Las kcal por 100 g van de 0 a 900.'),
    proteina: n(0, 100, 'Entre 0 y 100 g.'),
    carbos: n(0, 100, 'Entre 0 y 100 g.'),
    grasas: n(0, 100, 'Entre 0 y 100 g.'),
    porcionNombre: z.string().trim().max(40, 'Máximo 40 caracteres.'),
    porcionG: n(0.1, 5000, 'Escribe los gramos de la porción (o déjalo vacío).', true),
  })
  .refine((d) => (parseDecimal(d.proteina) ?? 0) + (parseDecimal(d.carbos) ?? 0) + (parseDecimal(d.grasas) ?? 0) <= 100.5, {
    path: ['grasas'],
    message: 'Proteína + carbos + grasas no pueden sumar más de 100 g en 100 g de alimento.',
  })
type Datos = z.infer<typeof esquema>

const texto = (v: number | null | undefined, d = 1) => (v === null || v === undefined ? '' : formatoNumero(v, v % 1 ? d : 0).replace(/\./g, ''))

/** Crear o editar un alimento propio (valores por 100 g). */
export default function EditarAlimento() {
  const userId = useUsuario()
  const { id } = useParams()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const lista = useMisAlimentos(userId)
  const existente = id ? lista?.find((a) => a.id === id) : undefined
  const volver = () => navegar(params.get('volver') === 'agregar' ? '/agregar' : '/mis-alimentos')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    values: {
      nombre: existente?.nombre ?? params.get('nombre') ?? '',
      marca: existente?.marca ?? '',
      kcal: texto(existente?.kcal),
      proteina: texto(existente?.proteina),
      carbos: texto(existente?.carbos),
      grasas: texto(existente?.grasas),
      porcionNombre: existente?.porcionNombre ?? '',
      porcionG: texto(existente?.porcionG),
    },
  })

  if (id && lista === undefined) return <PantallaCargando />
  if (id && !existente) {
    return <p className="p-4">Este alimento no existe o fue borrado.</p>
  }

  const v = watch()
  const valores = { kcal: parseDecimal(v.kcal) ?? 0, proteina: parseDecimal(v.proteina) ?? 0, carbos: parseDecimal(v.carbos) ?? 0, grasas: parseDecimal(v.grasas) ?? 0 }
  const completos = [v.kcal, v.proteina, v.carbos, v.grasas].every((x) => x.trim() !== '')
  const incoherente = completos && !validarCoherenciaKcal(valores)

  const enviar = handleSubmit(async (d) => {
    const ahora = ahoraISO()
    const fila: MiAlimento = {
      id: existente?.id ?? nuevoId(),
      userId,
      nombre: d.nombre,
      marca: d.marca || null,
      kcal: parseDecimal(d.kcal)!,
      proteina: parseDecimal(d.proteina)!,
      carbos: parseDecimal(d.carbos)!,
      grasas: parseDecimal(d.grasas)!,
      porcionNombre: d.porcionG.trim() ? d.porcionNombre || '1 porción' : null,
      porcionG: d.porcionG.trim() ? parseDecimal(d.porcionG) : null,
      createdAt: existente?.createdAt ?? ahora,
      updatedAt: ahora,
      deletedAt: null,
    }
    await guardar('misAlimentos', fila)
    toast.success(existente ? 'Alimento actualizado' : 'Alimento creado')
    volver()
  })

  const eliminar = async () => {
    if (!existente) return
    await borrar('misAlimentos', existente)
    navegar('/mis-alimentos')
    toast(`Borraste ${existente.nombre}`, { action: { label: 'Deshacer', onClick: () => void guardar('misAlimentos', { ...existente, deletedAt: null }) } })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={volver} aria-label="Volver">
          <ArrowLeft aria-hidden />
        </Boton>
        <h1 className="text-4xl sm:text-5xl">{existente ? 'Editar alimento' : 'Nuevo alimento'}</h1>
      </header>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <Tarjeta className="flex flex-col gap-4">
          <Campo etiqueta="Nombre" error={errors.nombre?.message}>
            {(a) => <Entrada placeholder="Ej. Pan amasado de la esquina" {...a} {...register('nombre')} />}
          </Campo>
          <Campo etiqueta="Marca (opcional)" error={errors.marca?.message}>
            {(a) => <Entrada {...a} {...register('marca')} />}
          </Campo>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">Valores por 100 g</h2>
            <p className="text-sm text-texto-secundario">Están en la tabla nutricional del envase, columna "100 g".</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Campo etiqueta="Kcal" error={errors.kcal?.message}>
              {(a) => <Entrada inputMode="decimal" {...a} {...register('kcal')} />}
            </Campo>
            <Campo etiqueta="Proteína (g)" error={errors.proteina?.message}>
              {(a) => <Entrada inputMode="decimal" {...a} {...register('proteina')} />}
            </Campo>
            <Campo etiqueta="Carbos (g)" error={errors.carbos?.message}>
              {(a) => <Entrada inputMode="decimal" {...a} {...register('carbos')} />}
            </Campo>
            <Campo etiqueta="Grasas (g)" error={errors.grasas?.message}>
              {(a) => <Entrada inputMode="decimal" {...a} {...register('grasas')} />}
            </Campo>
          </div>
          {incoherente && (
            <p className="flex gap-2 text-sm" role="status">
              <TriangleAlert className="size-5 shrink-0 text-alerta" aria-hidden />
              <span>
                Revisa los valores: con esos macros deberían ser cerca de{' '}
                <strong className="num">{formatoNumero(valores.proteina * 4 + valores.carbos * 4 + valores.grasas * 9)} kcal</strong>. Puedes guardar igual.
              </span>
            </p>
          )}
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-4">
          <h2 className="font-semibold">Porción típica (opcional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombre de la porción" error={errors.porcionNombre?.message}>
              {(a) => <Entrada placeholder="Ej. 1 unidad" {...a} {...register('porcionNombre')} />}
            </Campo>
            <Campo etiqueta="Gramos" error={errors.porcionG?.message}>
              {(a) => <Entrada inputMode="decimal" placeholder="Ej. 90" {...a} {...register('porcionG')} />}
            </Campo>
          </div>
        </Tarjeta>
        <div className="flex gap-3">
          {existente && (
            <Boton variante="peligro" onClick={eliminar}>
              <Trash2 aria-hidden /> Borrar
            </Boton>
          )}
          <Boton type="submit" ancho="completo" disabled={isSubmitting}>
            Guardar
          </Boton>
        </div>
      </form>
    </div>
  )
}
