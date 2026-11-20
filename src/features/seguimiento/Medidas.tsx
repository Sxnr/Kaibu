// Medidas del cuerpo (RF-35): cintura, pecho, brazo y muslo, con el cambio desde la primera.
import { Plus, Ruler, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Medida } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { fechaCorta, formatoNumero, hoyISO, parseDecimal } from '@/domain/format/formato'
import { cambioMedidas, PARTES, validarMedidas, type ErroresMedidas, type Medidas as ValoresMedidas, type Parte } from '@/domain/seguimiento/seguimiento'

const NOMBRE: Record<Parte, string> = { cintura: 'Cintura', pecho: 'Pecho', brazo: 'Brazo', muslo: 'Muslo' }

const cm = (v: number | null) => (v === null ? '—' : `${formatoNumero(v, v % 1 ? 1 : 0)} cm`)
const signo = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatoNumero(Math.abs(v), Math.abs(v) % 1 ? 1 : 0)} cm`

export function SeccionMedidas({ userId, medidas }: { userId: string; medidas: Medida[] }) {
  const [edicion, setEdicion] = useState<{ medida: Medida | null; abierta: boolean }>({ medida: null, abierta: false })
  const cambio = cambioMedidas(medidas)
  const ultimoValor = (p: Parte) => [...medidas].reverse().find((m) => m[p] !== null)?.[p] ?? null

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Ruler className="size-5 text-texto-marca" aria-hidden /> Medidas
        </h2>
        {medidas.length > 0 && (
          <Boton tamano="sm" onClick={() => setEdicion({ medida: null, abierta: true })}>
            <Plus aria-hidden /> Anotar medidas
          </Boton>
        )}
      </div>
      {medidas.length === 0 ? (
        <EstadoVacio
          compacto
          icono={Ruler}
          titulo="Aún no anotas medidas"
          texto="Mide cintura, pecho, brazo y muslo cada 2 a 4 semanas: muestran el cambio que la balanza no ve."
          accion={
            <Boton onClick={() => setEdicion({ medida: null, abierta: true })}>
              <Plus aria-hidden /> Anotar medidas
            </Boton>
          }
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PARTES.map((p) => (
              <div key={p} className="rounded-xl bg-superficie-elevada p-3">
                <dt className="text-sm text-texto-secundario">{NOMBRE[p]}</dt>
                <dd className="num text-2xl font-bold">{cm(ultimoValor(p))}</dd>
                {cambio[p] !== null && <dd className="text-sm text-texto-secundario">{signo(cambio[p]!)} desde el inicio</dd>}
              </div>
            ))}
          </dl>
          <ul className="flex flex-col" aria-label="Historial de medidas">
            {[...medidas].reverse().slice(0, 8).map((m) => (
              <li key={m.fecha}>
                <button type="button" onClick={() => setEdicion({ medida: m, abierta: true })} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm hover:bg-superficie-elevada">
                  <span className="w-20 shrink-0 font-medium">{fechaCorta(m.fecha)}</span>
                  <span className="min-w-0 flex-1 truncate text-texto-secundario">
                    {PARTES.filter((p) => m[p] !== null)
                      .map((p) => `${NOMBRE[p]} ${cm(m[p])}`)
                      .join(' · ')}
                  </span>
                  <span className="sr-only">Editar</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <EditarMedidas key={`${edicion.medida?.fecha ?? 'nueva'}-${edicion.abierta}`} userId={userId} abierta={edicion.abierta} medida={edicion.medida} alCambiar={(a) => setEdicion((e) => ({ ...e, abierta: a }))} />
    </Tarjeta>
  )
}

function EditarMedidas({ userId, abierta, medida, alCambiar }: { userId: string; abierta: boolean; medida: Medida | null; alCambiar: (a: boolean) => void }) {
  const [fecha, setFecha] = useState(medida?.fecha ?? hoyISO())
  const [textos, setTextos] = useState<Record<Parte, string>>(() =>
    Object.fromEntries(PARTES.map((p) => [p, medida?.[p] != null ? String(medida[p]).replace('.', ',') : ''])) as Record<Parte, string>,
  )
  const [errores, setErrores] = useState<ErroresMedidas>({})

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const valores = Object.fromEntries(PARTES.map((p) => [p, textos[p].trim() ? (parseDecimal(textos[p]) ?? NaN) : null])) as ValoresMedidas
    const e2 = validarMedidas(valores)
    setErrores(e2)
    if (Object.keys(e2).length > 0) return
    await guardar('medidas', { userId, fecha, ...valores, updatedAt: '', deletedAt: null } satisfies Medida)
    toast('Medidas guardadas')
    alCambiar(false)
  }
  const quitar = async () => {
    if (!medida) return
    await borrar('medidas', medida)
    alCambiar(false)
    toast(`Borraste las medidas del ${fechaCorta(medida.fecha)}`, { action: { label: 'Deshacer', onClick: () => void guardar('medidas', { ...medida, deletedAt: null }) } })
  }

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo={medida ? 'Editar medidas' : 'Anotar medidas'} descripcion="En centímetros. Deja vacío lo que no mediste.">
      <form onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-4">
        {!medida && (
          <Campo etiqueta="Fecha">
            {(a) => <Entrada type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value || hoyISO())} {...a} />}
          </Campo>
        )}
        <div className="grid grid-cols-2 gap-3">
          {PARTES.map((p) => (
            <Campo key={p} etiqueta={`${NOMBRE[p]} (cm)`} error={errores[p]}>
              {(a) => <Entrada inputMode="decimal" value={textos[p]} onChange={(e) => setTextos((t) => ({ ...t, [p]: e.target.value }))} className="num text-xl" {...a} />}
            </Campo>
          ))}
        </div>
        {errores.general && (
          <p role="alert" className="text-sm font-medium text-texto-marca">
            {errores.general}
          </p>
        )}
        <Boton type="submit" ancho="completo">
          Guardar
        </Boton>
        {medida && (
          <Boton type="button" variante="fantasma" ancho="completo" onClick={() => void quitar()}>
            <Trash2 aria-hidden /> Borrar estas medidas
          </Boton>
        )}
      </form>
    </Hoja>
  )
}
