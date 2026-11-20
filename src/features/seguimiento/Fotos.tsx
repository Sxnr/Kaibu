// Fotos de progreso privadas (RF-34): línea de tiempo con fecha y peso, y comparar antes/ahora.
import type { SupabaseClient } from '@supabase/supabase-js'
import { Camera, Columns2, ImagePlus, Lock, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Hoja } from '@/components/ui/hoja'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Foto, Peso } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { guardarFotoNueva, useImagenFoto } from '@/data/fotos'
import { obtenerSupabase } from '@/data/supabase'
import { fechaCorta, formatoNumero, hoyISO } from '@/domain/format/formato'
import { cn } from '@/lib/utils'

function useCliente(): SupabaseClient | null {
  const [cliente, setCliente] = useState<SupabaseClient | null>(null)
  useEffect(() => {
    void obtenerSupabase().then(setCliente)
  }, [])
  return cliente
}

const pie = (f: Foto) => `${fechaCorta(f.fecha)}${f.pesoKg ? ` · ${formatoNumero(f.pesoKg, 1)} kg` : ''}`

function Imagen({ foto, cliente, className }: { foto: Foto; cliente: SupabaseClient | null; className?: string }) {
  const url = useImagenFoto(foto, cliente)
  return url ? (
    <img src={url} alt={`Foto de progreso del ${pie(foto)}`} className={cn('h-full w-full object-cover', className)} />
  ) : (
    <span className={cn('grid h-full w-full place-items-center bg-superficie-elevada text-sm text-texto-secundario', className)}>Cargando…</span>
  )
}

export function SeccionFotos({ userId, fotos, pesos }: { userId: string; fotos: Foto[]; pesos: Peso[] }) {
  const cliente = useCliente()
  const entrada = useRef<HTMLInputElement>(null)
  const [comparando, setComparando] = useState(false)
  const [elegidas, setElegidas] = useState<string[]>([])
  const [vista, setVista] = useState<{ fotos: Foto[]; abierta: boolean }>({ fotos: [], abierta: false })
  const [guardando, setGuardando] = useState(false)

  const agregar = async (archivo: File | undefined) => {
    if (!archivo) return
    setGuardando(true)
    try {
      const hoy = hoyISO()
      const peso = pesos.find((p) => p.fecha === hoy)?.kg ?? pesos.at(-1)?.kg ?? null
      await guardarFotoNueva(userId, hoy, peso, archivo)
      toast('Foto guardada: solo tú puedes verla')
    } catch {
      toast('No se pudo guardar la foto. Prueba con otra imagen.')
    } finally {
      setGuardando(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  const tocar = (f: Foto) => {
    if (!comparando) return setVista({ fotos: [f], abierta: true })
    const nuevas = elegidas.includes(f.id) ? elegidas.filter((x) => x !== f.id) : [...elegidas, f.id].slice(-2)
    setElegidas(nuevas)
    if (nuevas.length === 2) {
      const par = fotos.filter((x) => nuevas.includes(x.id)).sort((a, b) => a.fecha.localeCompare(b.fecha))
      setVista({ fotos: par, abierta: true })
      setComparando(false)
      setElegidas([])
    }
  }

  const quitar = async (f: Foto) => {
    await borrar('fotos', f)
    setVista((v) => ({ ...v, abierta: false }))
    toast(`Borraste la foto del ${fechaCorta(f.fecha)}`, { action: { label: 'Deshacer', onClick: () => void guardar('fotos', { ...f, deletedAt: null }) } })
  }

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Camera className="size-5 text-texto-marca" aria-hidden /> Fotos de progreso
        </h2>
        <div className="flex gap-2">
          {fotos.length >= 2 && (
            <Boton
              variante={comparando ? 'primario' : 'contorno'}
              tamano="sm"
              aria-pressed={comparando}
              onClick={() => {
                setComparando((c) => !c)
                setElegidas([])
              }}
            >
              <Columns2 aria-hidden /> {comparando ? 'Elige 2 fotos' : 'Comparar'}
            </Boton>
          )}
          {fotos.length > 0 && (
            <Boton tamano="sm" onClick={() => entrada.current?.click()} disabled={guardando}>
              <ImagePlus aria-hidden /> {guardando ? 'Guardando…' : 'Agregar'}
            </Boton>
          )}
        </div>
      </div>
      <input ref={entrada} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Elegir foto de progreso" onChange={(e) => void agregar(e.target.files?.[0])} />
      <p className="flex items-center gap-2 text-sm text-texto-secundario">
        <Lock className="size-4 shrink-0" aria-hidden /> Privadas: solo tú puedes verlas, nunca se comparten.
      </p>
      {fotos.length === 0 ? (
        <EstadoVacio
          compacto
          icono={Camera}
          titulo="Aún no tienes fotos"
          texto="Saca una foto cada 2 a 4 semanas, con la misma luz y ropa. Después compara el antes y el ahora."
          accion={
            <Boton onClick={() => entrada.current?.click()} disabled={guardando}>
              <ImagePlus aria-hidden /> {guardando ? 'Guardando…' : 'Agregar foto'}
            </Boton>
          }
        />
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {fotos.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => tocar(f)}
                aria-pressed={comparando ? elegidas.includes(f.id) : undefined}
                aria-label={`${comparando ? 'Elegir' : 'Ver'} foto del ${pie(f)}`}
                className={cn('flex w-full flex-col gap-1 rounded-xl border-2 border-transparent p-0.5 text-left', elegidas.includes(f.id) && 'border-marca')}
              >
                <span className="block aspect-[3/4] overflow-hidden rounded-lg">
                  <Imagen foto={f} cliente={cliente} />
                </span>
                <span className="px-1 text-xs text-texto-secundario">{pie(f)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Hoja abierta={vista.abierta} alCambiar={(a) => setVista((v) => ({ ...v, abierta: a }))} titulo={vista.fotos.length === 2 ? 'Antes y ahora' : 'Foto de progreso'} className="lg:max-w-3xl">
        <div className={cn('grid gap-3', vista.fotos.length === 2 && 'grid-cols-2')}>
          {vista.fotos.map((f) => (
            <figure key={f.id} className="flex flex-col gap-1">
              <span className="block aspect-[3/4] overflow-hidden rounded-xl">
                <Imagen foto={f} cliente={cliente} />
              </span>
              <figcaption className="text-center text-sm font-medium">{pie(f)}</figcaption>
            </figure>
          ))}
        </div>
        {vista.fotos.length === 1 && vista.fotos[0] && (
          <Boton variante="fantasma" ancho="completo" className="mt-3" onClick={() => void quitar(vista.fotos[0]!)}>
            <Trash2 aria-hidden /> Borrar foto
          </Boton>
        )}
      </Hoja>
    </Tarjeta>
  )
}
