import { Check, Droplet, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Barra } from '@/components/Barra'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { DiaRegistro } from '@/data/db'
import { guardar } from '@/data/escritura'
import { avanceAgua, restarVaso, sumarVaso } from '@/domain/calc/agua'
import { formatoNumero } from '@/domain/format/formato'
import { diaVacio } from './registroDia'

interface Props {
  userId: string
  fecha: string
  dia: DiaRegistro | null
  metaMl: number
  vasoMl: number
}

/** Agua del día (RF-25): + 1 vaso o − 1 vaso, con la meta de RN-14 o la que eligió la persona. */
export function TarjetaAgua({ userId, fecha, dia, metaMl, vasoMl }: Props) {
  const actual = dia ?? diaVacio(userId, fecha)
  const ml = actual.aguaMl
  const avance = avanceAgua(ml, metaMl)

  const cambiar = async (nuevoMl: number) => {
    const anterior = actual
    await guardar('dias', { ...actual, aguaMl: nuevoMl })
    // Un solo aviso a la vez: tocar varias veces no apila mensajes.
    toast(`Agua: ${formatoNumero(nuevoMl)} ml`, {
      id: 'agua',
      action: { label: 'Deshacer', onClick: () => void guardar('dias', anterior) },
    })
  }

  return (
    <Tarjeta className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Droplet className="size-5 text-panel-cielo" aria-hidden /> Agua
        </h2>
        <Link to="/ajustes#vaso" className="text-sm font-semibold text-texto-marca underline-offset-2 hover:underline">
          Vaso de {formatoNumero(vasoMl)} ml
        </Link>
      </div>
      <p>
        <span className="num text-4xl leading-none font-bold">{formatoNumero(ml)}</span>
        <span className="text-texto-secundario"> de {formatoNumero(metaMl)} ml</span>
      </p>
      <Barra
        porcentaje={avance.porcentaje}
        etiqueta="Agua del día"
        texto={`${formatoNumero(ml)} de ${formatoNumero(metaMl)} ml`}
        colorClase="bg-panel-cielo"
      />
      <p className="flex items-center gap-1.5 text-sm text-texto-secundario">
        {avance.cumplida ? (
          <>
            <Check className="size-4 text-exito" strokeWidth={3} aria-hidden /> Meta de agua cumplida
          </>
        ) : ml === 0 ? (
          'Aún no anotas agua hoy.'
        ) : (
          `Te faltan ${formatoNumero(avance.faltanMl)} ml.`
        )}
      </p>
      <div className="mt-auto flex gap-2">
        <Boton
          variante="secundario"
          tamano="icono"
          aria-label={`Quitar un vaso de ${formatoNumero(vasoMl)} ml`}
          disabled={ml === 0}
          onClick={() => void cambiar(restarVaso(ml, vasoMl))}
        >
          <Minus aria-hidden />
        </Boton>
        <Boton ancho="completo" tamano="sm" onClick={() => void cambiar(sumarVaso(ml, vasoMl))} className="flex-1">
          <Plus aria-hidden /> 1 vaso ({formatoNumero(vasoMl)} ml)
        </Boton>
      </div>
    </Tarjeta>
  )
}
