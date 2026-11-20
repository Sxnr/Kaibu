// Formulario de un suplemento (crear o editar), en hoja inferior.
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { Hoja } from '@/components/ui/hoja'
import { nuevoId, type Suplemento } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { parseDecimal } from '@/domain/format/formato'
import { validarSuplemento, type ErroresSuplemento } from '@/domain/seguimiento/seguimiento'

interface Props {
  userId: string
  abierta: boolean
  suplemento: Suplemento | null
  alCambiar: (abierta: boolean) => void
}

export function EditarSuplemento(props: Props) {
  // Se reinicia el formulario cada vez que se abre con otro suplemento.
  return <Formulario key={`${props.suplemento?.id ?? 'nuevo'}-${props.abierta}`} {...props} />
}

function Formulario({ userId, abierta, suplemento, alCambiar }: Props) {
  const [nombre, setNombre] = useState(suplemento?.nombre ?? '')
  const [dosis, setDosis] = useState(suplemento?.dosis ?? '')
  const [hora, setHora] = useState(suplemento?.hora ?? '')
  const [kcal, setKcal] = useState(suplemento ? String(suplemento.kcal) : '0')
  const [proteina, setProteina] = useState(suplemento ? String(suplemento.proteina).replace('.', ',') : '0')
  const [activo, setActivo] = useState(suplemento?.activo ?? true)
  const [errores, setErrores] = useState<ErroresSuplemento>({})

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const datos = { nombre, dosis, hora, kcal: parseDecimal(kcal) ?? NaN, proteina: parseDecimal(proteina) ?? NaN }
    const e2 = validarSuplemento(datos)
    setErrores(e2)
    if (Object.keys(e2).length > 0) return
    await guardar('suplementos', {
      id: suplemento?.id ?? nuevoId(),
      userId,
      nombre: nombre.trim(),
      dosis: dosis.trim() || null,
      hora: hora || null,
      kcal: Math.round(datos.kcal),
      proteina: Math.round(datos.proteina * 10) / 10,
      activo,
      createdAt: suplemento?.createdAt ?? new Date().toISOString(),
      updatedAt: '',
      deletedAt: null,
    } satisfies Suplemento)
    toast(suplemento ? 'Suplemento guardado' : `${nombre.trim()} agregado`)
    alCambiar(false)
  }

  const quitar = async () => {
    if (!suplemento) return
    await borrar('suplementos', suplemento)
    alCambiar(false)
    toast(`Borraste ${suplemento.nombre}`, { action: { label: 'Deshacer', onClick: () => void guardar('suplementos', { ...suplemento, deletedAt: null }) } })
  }

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo={suplemento ? 'Editar suplemento' : 'Nuevo suplemento'}>
      <form onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-4">
        <Campo etiqueta="Nombre" error={errores.nombre}>
          {(a) => <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Creatina" {...a} />}
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Dosis (opcional)" error={errores.dosis}>
            {(a) => <Entrada value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Ej. 5 g" {...a} />}
          </Campo>
          <Campo etiqueta="Hora (opcional)" error={errores.hora}>
            {(a) => <Entrada type="time" value={hora} onChange={(e) => setHora(e.target.value)} {...a} />}
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Kcal por dosis" error={errores.kcal} ayuda="0 si no tiene.">
            {(a) => <Entrada inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} className="num" {...a} />}
          </Campo>
          <Campo etiqueta="Proteína (g)" error={errores.proteina}>
            {(a) => <Entrada inputMode="decimal" value={proteina} onChange={(e) => setProteina(e.target.value)} className="num" {...a} />}
          </Campo>
        </div>
        <div className="flex items-center gap-3">
          <Casilla id="suplemento-activo" checked={activo} onCheckedChange={(v) => setActivo(v === true)} />
          <label htmlFor="suplemento-activo">Lo estoy tomando (aparece cada día)</label>
        </div>
        <Boton type="submit" ancho="completo">
          Guardar
        </Boton>
        {suplemento && (
          <Boton type="button" variante="fantasma" ancho="completo" onClick={() => void quitar()}>
            <Trash2 aria-hidden /> Borrar suplemento
          </Boton>
        )}
      </form>
    </Hoja>
  )
}
