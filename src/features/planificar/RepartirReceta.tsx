// Repartir una preparación en varios días de una comida (por ejemplo, el almuerzo de lunes a viernes).
import { useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { Opciones } from '@/components/ui/opciones'
import { miAlimentoAAlimento } from '@/data/consultas'
import type { MiAlimento, Receta } from '@/data/db'
import { borrar, guardarVarios } from '@/data/escritura'
import type { ComidaReparto } from '@/domain/calc/types'
import { fechaLarga, inicioSemana, parseDecimal, sumarDias } from '@/domain/format/formato'
import { diasParaRepartir } from '@/domain/plan/repartir'
import { nuevoRegistro } from '@/features/agregar/registrar'
import { cn, vibrar } from '@/lib/utils'

// Días de la semana (getDay: 0 = domingo), en el orden chileno de lunes a domingo.
const DIAS = [
  { n: 1, corto: 'L', nombre: 'lunes' },
  { n: 2, corto: 'M', nombre: 'martes' },
  { n: 3, corto: 'M', nombre: 'miércoles' },
  { n: 4, corto: 'J', nombre: 'jueves' },
  { n: 5, corto: 'V', nombre: 'viernes' },
  { n: 6, corto: 'S', nombre: 'sábado' },
  { n: 0, corto: 'D', nombre: 'domingo' },
]

interface Props {
  abierta: boolean
  alCambiar: (abierta: boolean) => void
  receta: Receta | null
  alimento: MiAlimento | undefined
  comidas: ComidaReparto[]
  userId: string
  hoy: string
}

export function RepartirReceta({ abierta, alCambiar, receta, alimento, comidas, userId, hoy }: Props) {
  const [comida, setComida] = useState(comidas.find((c) => c.id === 'almuerzo')?.id ?? comidas[0]?.id ?? '')
  const [semana, setSemana] = useState<'esta' | 'proxima'>('proxima')
  const [dias, setDias] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))
  const [porcionesTexto, setPorcionesTexto] = useState('1')
  const [error, setError] = useState<string | undefined>()

  const lunes = inicioSemana(semana === 'esta' ? hoy : sumarDias(hoy, 7))
  const fechas = diasParaRepartir(lunes, sumarDias(lunes, 6), [...dias]).filter((f) => f >= hoy)
  const porciones = parseDecimal(porcionesTexto) ?? 0
  const alternar = (n: number) =>
    setDias((x) => {
      const nuevo = new Set(x)
      if (nuevo.has(n)) nuevo.delete(n)
      else nuevo.add(n)
      return nuevo
    })

  const repartir = async () => {
    if (!receta || !alimento) return
    if (porciones <= 0 || porciones > 10) return setError('Entre 0,5 y 10 porciones por día')
    if (fechas.length === 0) return setError('Elige al menos un día que no haya pasado')
    const a = miAlimentoAAlimento(alimento)
    const nuevos = fechas.map((fecha) => nuevoRegistro({ userId, fecha, comida, alimento: a, modo: 'porcion', cantidad: porciones }))
    await guardarVarios('registros', nuevos)
    vibrar()
    alCambiar(false)
    const nombreComida = comidas.find((c) => c.id === comida)?.nombre ?? ''
    toast(`${receta.nombre} planificado en ${fechas.length} ${fechas.length === 1 ? 'día' : 'días'} (${nombreComida})`, {
      action: { label: 'Deshacer', onClick: () => void Promise.all(nuevos.map((r) => borrar('registros', r))) },
    })
  }

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo={`Repartir ${receta?.nombre ?? ''}`} descripcion="Queda planificado: se suma solo cuando llegue cada día.">
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium">Comida</p>
          <Opciones etiqueta="Comida" columnas={2} valor={comida} alCambiar={setComida} opciones={comidas.map((c) => ({ valor: c.id, titulo: c.nombre }))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Semana</p>
          <Opciones
            etiqueta="Semana"
            columnas={2}
            valor={semana}
            alCambiar={setSemana}
            opciones={[
              { valor: 'esta', titulo: 'Esta semana' },
              { valor: 'proxima', titulo: 'La próxima' },
            ]}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Días</legend>
          <div className="grid grid-cols-7 gap-1">
            {DIAS.map((d) => (
              <button
                key={d.n}
                type="button"
                aria-pressed={dias.has(d.n)}
                aria-label={d.nombre}
                onClick={() => {
                  alternar(d.n)
                  setError(undefined)
                }}
                className={cn(
                  'grid min-h-11 place-items-center rounded-xl border-2 font-semibold transition-colors',
                  dias.has(d.n) ? 'border-marca bg-marca text-sobre-marca' : 'border-borde hover:bg-superficie-elevada',
                )}
              >
                {d.corto}
              </button>
            ))}
          </div>
        </fieldset>
        <Campo etiqueta="Porciones por día" error={error}>
          {(a) => <Entrada inputMode="decimal" value={porcionesTexto} onChange={(e) => setPorcionesTexto(e.target.value)} className="num w-28 text-xl" {...a} />}
        </Campo>
        <p className="text-sm text-texto-secundario" aria-live="polite">
          {fechas.length === 0
            ? 'Ningún día elegido (los días que ya pasaron no se cuentan).'
            : `Se planifica: ${fechas.map((f) => fechaLarga(f).split(' ').slice(0, 2).join(' ')).join(', ')}.`}
        </p>
        <Boton ancho="completo" onClick={() => void repartir()}>
          Repartir
        </Boton>
      </div>
    </Hoja>
  )
}
