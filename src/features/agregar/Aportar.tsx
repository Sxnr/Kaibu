// Aportar un producto a la comunidad copiando su tabla nutricional (columna "100 g").
// Queda disponible al tiro para todas las personas que usan Kaibu, y otras lo confirman con la etiqueta.
import { ArrowLeft, HeartHandshake } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Tarjeta } from '@/components/ui/tarjeta'
import { nuevoId } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { limpiarCodigo, validarAporte, type DatosAporte, type ErroresAporte } from '@/domain/alimentos/comunidad'
import { parseDecimal } from '@/domain/format/formato'
import { vibrar } from '@/lib/utils'

type Textos = Record<'codigo' | 'nombre' | 'marca' | 'porcionNombre' | 'porcionG' | 'kcal' | 'proteina' | 'carbos' | 'grasas', string>

const NUTRIENTES = [
  { campo: 'kcal', etiqueta: 'Energía (kcal)' },
  { campo: 'proteina', etiqueta: 'Proteínas (g)' },
  { campo: 'carbos', etiqueta: 'Hidratos de carbono (g)' },
  { campo: 'grasas', etiqueta: 'Grasas totales (g)' },
] as const

export default function Aportar() {
  const userId = useUsuario()
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const [t, setT] = useState<Textos>({
    codigo: limpiarCodigo(params.get('codigo') ?? ''),
    nombre: params.get('nombre') ?? '',
    marca: '',
    porcionNombre: '',
    porcionG: '',
    kcal: '',
    proteina: '',
    carbos: '',
    grasas: '',
  })
  const [errores, setErrores] = useState<ErroresAporte>({})
  const volver = () => (params.get('volver') === 'agregar' ? navegar('/agregar') : navegar(-1))
  // Al corregir un campo se quita su aviso (y el de calorías, que depende de los macros).
  const cambiar = (campo: keyof Textos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setT((x) => ({ ...x, [campo]: e.target.value }))
    const afecta = new Set<string>([campo, ...(['kcal', 'proteina', 'carbos', 'grasas'].includes(campo) ? ['kcal', 'grasas'] : [])])
    setErrores((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !afecta.has(k))) as ErroresAporte)
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const numero = (v: string) => parseDecimal(v) ?? NaN
    const datos: DatosAporte = {
      codigo: limpiarCodigo(t.codigo),
      nombre: t.nombre.trim(),
      marca: t.marca.trim(),
      kcal: numero(t.kcal),
      proteina: numero(t.proteina),
      carbos: numero(t.carbos),
      grasas: numero(t.grasas),
      porcionNombre: t.porcionNombre.trim(),
      porcionG: t.porcionG.trim() ? numero(t.porcionG) : null,
    }
    const e2 = validarAporte(datos)
    setErrores(e2)
    if (Object.keys(e2).length > 0) return
    const ahora = new Date().toISOString()
    const aporte = await guardar('aportes', {
      id: nuevoId(),
      userId,
      codigo: datos.codigo || null,
      nombre: datos.nombre,
      marca: datos.marca || null,
      kcal: datos.kcal,
      proteina: datos.proteina,
      carbos: datos.carbos,
      grasas: datos.grasas,
      porcionNombre: datos.porcionNombre || null,
      porcionG: datos.porcionG,
      confirmaciones: 0,
      reportes: 0,
      estado: 'nuevo' as const,
      createdAt: ahora,
      updatedAt: '',
      deletedAt: null,
    })
    vibrar()
    toast(`¡Gracias! ${datos.nombre} ya está disponible para todos`, {
      action: { label: 'Deshacer', onClick: () => void borrar('aportes', aporte) },
    })
    navegar(`/agregar?q=${encodeURIComponent(datos.nombre)}`, { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={volver} aria-label="Volver">
          <ArrowLeft aria-hidden />
        </Boton>
        <div>
          <h1 className="text-4xl sm:text-5xl">Aportar producto</h1>
          <p className="text-sm text-texto-secundario">Para todas las personas que usan Kaibu</p>
        </div>
      </header>

      <Tarjeta className="flex gap-3">
        <HeartHandshake className="size-6 shrink-0 text-texto-marca" aria-hidden />
        <p className="text-sm">
          Copia la <strong>tabla nutricional</strong> del envase, de la columna <strong>"100 g"</strong>. Otras personas lo confirman con su etiqueta y, con 2 confirmaciones,
          queda verificado.
        </p>
      </Tarjeta>

      <form onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Nombre del producto" error={errores.nombre}>
          {(a) => <Entrada value={t.nombre} onChange={cambiar('nombre')} placeholder="Ej. Spaghetti 5" {...a} />}
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Marca (opcional)" error={errores.marca}>
            {(a) => <Entrada value={t.marca} onChange={cambiar('marca')} placeholder="Ej. Lucchetti" {...a} />}
          </Campo>
          <Campo etiqueta="Código de barras (opcional)" error={errores.codigo} ayuda="Los números bajo las barras.">
            {(a) => <Entrada inputMode="numeric" value={t.codigo} onChange={cambiar('codigo')} className="num" {...a} />}
          </Campo>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-borde p-4">
          <legend className="px-1 text-sm font-semibold">Por 100 g (o 100 ml)</legend>
          <div className="grid grid-cols-2 gap-3">
            {NUTRIENTES.map(({ campo, etiqueta }) => (
              <Campo key={campo} etiqueta={etiqueta} error={errores[campo]}>
                {(a) => <Entrada inputMode="decimal" value={t[campo]} onChange={cambiar(campo)} className="num text-xl" {...a} />}
              </Campo>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-borde p-4">
          <legend className="px-1 text-sm font-semibold">Porción (opcional)</legend>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombre" error={errores.porcionNombre}>
              {(a) => <Entrada value={t.porcionNombre} onChange={cambiar('porcionNombre')} placeholder="Ej. 1 plato" {...a} />}
            </Campo>
            <Campo etiqueta="Gramos" error={errores.porcionG}>
              {(a) => <Entrada inputMode="decimal" value={t.porcionG} onChange={cambiar('porcionG')} placeholder="Ej. 80" className="num" {...a} />}
            </Campo>
          </div>
        </fieldset>

        <Boton type="submit" ancho="completo">
          Aportar a la comunidad
        </Boton>
      </form>
    </div>
  )
}
