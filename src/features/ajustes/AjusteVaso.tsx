import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Entrada } from '@/components/ui/campo'
import { Opciones } from '@/components/ui/opciones'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Perfil } from '@/data/db'
import { guardar } from '@/data/escritura'
import { VASO_MAX_ML, VASO_MIN_ML, vasoValido } from '@/domain/calc/agua'
import { formatoNumero } from '@/domain/format/formato'

const TAMANOS = ['200', '250', '350', '500'] as const

/** Tamaño del vaso para el botón "+ 1 vaso" (RF-25): entre 100 y 1.000 ml. */
export function AjusteVaso({ perfil }: { perfil: Perfil }) {
  const id = useId()
  const [otro, setOtro] = useState(TAMANOS.includes(String(perfil.vasoMl) as (typeof TAMANOS)[number]) ? '' : String(perfil.vasoMl))
  const [error, setError] = useState('')

  const elegir = async (ml: number) => {
    if (ml === perfil.vasoMl) return
    const anterior = perfil
    await guardar('perfiles', { ...perfil, vasoMl: ml })
    toast(`Vaso de ${formatoNumero(ml)} ml`, { id: 'vaso', action: { label: 'Deshacer', onClick: () => void guardar('perfiles', anterior) } })
  }

  const guardarOtro = () => {
    if (!otro.trim()) return setError('')
    const ml = Number(otro)
    if (!vasoValido(ml)) return setError(`Escribe un número entero entre ${formatoNumero(VASO_MIN_ML)} y ${formatoNumero(VASO_MAX_ML)} ml.`)
    setError('')
    void elegir(ml)
  }

  return (
    <Tarjeta id="vaso" className="scroll-mt-20">
      <h2 className="font-semibold">Tamaño de tu vaso</h2>
      <p className="mb-3 text-sm text-texto-secundario">Es lo que suma el botón "+ 1 vaso" en Hoy.</p>
      <Opciones
        etiqueta="Tamaño del vaso"
        valor={TAMANOS.find((t) => Number(t) === perfil.vasoMl)}
        alCambiar={(t) => {
          setOtro('')
          void elegir(Number(t))
        }}
        columnas={4}
        opciones={TAMANOS.map((t) => ({ valor: t, titulo: `${formatoNumero(Number(t))} ml` }))}
        className="max-sm:grid-cols-2"
      />
      <div className="mt-3 flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold">
          Otro tamaño (ml)
        </label>
        <Entrada
          id={id}
          inputMode="numeric"
          value={otro}
          onChange={(e) => setOtro(e.target.value.replace(/\D/g, ''))}
          onBlur={guardarOtro}
          onKeyDown={(e) => e.key === 'Enter' && guardarOtro()}
          placeholder={`Entre ${formatoNumero(VASO_MIN_ML)} y ${formatoNumero(VASO_MAX_ML)}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="max-w-48"
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm font-medium text-texto-marca">
            {error}
          </p>
        )}
      </div>
    </Tarjeta>
  )
}
