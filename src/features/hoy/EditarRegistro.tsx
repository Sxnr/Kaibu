import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import type { RegistroComida } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import type { ComidaReparto } from '@/domain/calc/types'
import { formatoNumero, parseDecimal } from '@/domain/format/formato'
import { vibrar } from '@/lib/utils'

interface Props {
  registro: RegistroComida | null
  abierta: boolean
  comidas: ComidaReparto[]
  alCerrar: () => void
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Editar cantidad, cambiar de comida o borrar un alimento registrado (con "Deshacer"). */
export function EditarRegistro({ registro, abierta, comidas, alCerrar }: Props) {
  const [gramos, setGramos] = useState('')
  const [kcal, setKcal] = useState('')
  const [proteina, setProteina] = useState('')
  const [comida, setComida] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!registro) return
    setGramos(registro.gramos ? formatoNumero(registro.gramos, registro.gramos % 1 ? 1 : 0) : '')
    setKcal(String(registro.kcal))
    setProteina(formatoNumero(registro.proteina, 1))
    setComida(registro.comida)
    setError(undefined)
  }, [registro])

  if (!registro) return null

  const porGramos = registro.gramos !== null && registro.gramos > 0
  const factor = porGramos ? (parseDecimal(gramos) ?? 0) / registro.gramos! : 1

  const guardarCambios = async () => {
    const anterior = registro
    if (porGramos) {
      const g = parseDecimal(gramos)
      if (g === null || g <= 0 || g > 5000) return setError('Escribe una cantidad en gramos entre 1 y 5.000.')
      await guardar('registros', {
        ...registro,
        comida,
        gramos: g,
        unidad: `${formatoNumero(g)} g`,
        cantidad: g,
        kcal: Math.round(registro.kcal * factor),
        proteina: r1(registro.proteina * factor),
        carbos: r1(registro.carbos * factor),
        grasas: r1(registro.grasas * factor),
      })
    } else {
      const k = parseDecimal(kcal)
      const p = parseDecimal(proteina) ?? 0
      if (k === null || k < 0 || k > 10000) return setError('Escribe las kcal (entre 0 y 10.000).')
      await guardar('registros', { ...registro, comida, kcal: Math.round(k), proteina: r1(p) })
    }
    vibrar()
    alCerrar()
    toast('Cambios guardados', { action: { label: 'Deshacer', onClick: () => void guardar('registros', anterior) } })
  }

  const eliminar = async () => {
    const anterior = registro
    await borrar('registros', registro)
    vibrar()
    alCerrar()
    toast(`Borraste ${anterior.nombre}`, { action: { label: 'Deshacer', onClick: () => void guardar('registros', { ...anterior, deletedAt: null }) } })
  }

  return (
    <Hoja abierta={abierta} alCambiar={(v) => !v && alCerrar()} titulo={registro.nombre} descripcion={`${formatoNumero(registro.kcal)} kcal · ${registro.unidad}`}>
      <div className="flex flex-col gap-4">
        {porGramos ? (
          <Campo etiqueta="Cantidad (g)" error={error} ayuda={`Equivale a ${formatoNumero(Math.round(registro.kcal * factor))} kcal.`}>
            {(a) => <Entrada inputMode="decimal" value={gramos} onChange={(e) => setGramos(e.target.value)} {...a} />}
          </Campo>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Kcal" error={error}>
              {(a) => <Entrada inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} {...a} />}
            </Campo>
            <Campo etiqueta="Proteína (g)">
              {(a) => <Entrada inputMode="decimal" value={proteina} onChange={(e) => setProteina(e.target.value)} {...a} />}
            </Campo>
          </div>
        )}
        <Campo etiqueta="Comida">
          {(a) => (
            <select
              value={comida}
              onChange={(e) => setComida(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-borde-control bg-superficie px-4 text-base"
              {...a}
            >
              {comidas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              {!comidas.some((c) => c.id === registro.comida) && <option value={registro.comida}>Otras</option>}
            </select>
          )}
        </Campo>
        <div className="flex gap-3">
          <Boton variante="peligro" onClick={eliminar} className="shrink-0">
            <Trash2 aria-hidden /> Borrar
          </Boton>
          <Boton ancho="completo" onClick={guardarCambios}>
            Guardar
          </Boton>
        </div>
      </div>
    </Hoja>
  )
}
