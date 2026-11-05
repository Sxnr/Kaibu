import { Copy, Link2, Unlink } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'
import { formatoNumero } from '@/domain/format/formato'
import { crearCodigo, desvincular, leerVinculo, type Vinculo } from './discord'

const DURACION_CODIGO_MS = 10 * 60 * 1000
const REVISAR_CADA_MS = 5000

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'sin' } | { tipo: 'vinculado'; vinculo: Vinculo }

/** Unir la cuenta de Kaibu con Discord: la app muestra un código y la persona lo escribe en /vincular. */
export function VinculoDiscord({ disponible, motivo }: { disponible: boolean; motivo: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [codigo, setCodigo] = useState<{ valor: string; vence: number } | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())
  const [ocupado, setOcupado] = useState(false)
  const pendienteDesvincular = useRef<number | null>(null)

  const revisar = useCallback(async () => {
    try {
      const v = await leerVinculo()
      setEstado(v ? { tipo: 'vinculado', vinculo: v } : { tipo: 'sin' })
      if (v) setCodigo(null)
    } catch {
      setEstado({ tipo: 'error' })
    }
  }, [])

  useEffect(() => {
    if (disponible) void revisar()
  }, [disponible, revisar])

  // Mientras hay un código vigente, revisa cada 5 s si ya se usó en Discord.
  useEffect(() => {
    if (!codigo) return
    const id = window.setInterval(() => {
      setAhora(Date.now())
      if (Date.now() > codigo.vence) setCodigo(null)
      else void revisar()
    }, REVISAR_CADA_MS)
    return () => window.clearInterval(id)
  }, [codigo, revisar])

  useEffect(() => () => {
    if (pendienteDesvincular.current) window.clearTimeout(pendienteDesvincular.current)
  }, [])

  const generar = async () => {
    setOcupado(true)
    try {
      const valor = await crearCodigo()
      setCodigo({ valor, vence: Date.now() + DURACION_CODIGO_MS })
      setAhora(Date.now())
    } catch {
      toast.error('No pudimos crear el código. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  const copiar = async () => {
    if (!codigo) return
    try {
      await navigator.clipboard.writeText(`/vincular codigo:${codigo.valor}`)
      toast.success('Copiado. Pégalo en cualquier canal del Discord de Kaibu.')
    } catch {
      toast.error('No se pudo copiar: escríbelo a mano.')
    }
  }

  const quitar = () => {
    if (estado.tipo !== 'vinculado') return
    const anterior = estado
    setEstado({ tipo: 'sin' })
    // Se espera 5 s antes de desvincular de verdad, para poder deshacer.
    pendienteDesvincular.current = window.setTimeout(() => {
      pendienteDesvincular.current = null
      desvincular().catch(() => {
        setEstado(anterior)
        toast.error('No pudimos desvincular tu Discord. Intenta de nuevo con conexión.')
      })
    }, 5000)
    toast('Tu Discord se desvinculará y perderás los roles de Kaibu.', {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (pendienteDesvincular.current) window.clearTimeout(pendienteDesvincular.current)
          pendienteDesvincular.current = null
          setEstado(anterior)
        },
      },
    })
  }

  const minutos = codigo ? Math.max(1, Math.ceil((codigo.vence - ahora) / 60000)) : 0

  return (
    <Tarjeta>
      <h2 className="flex items-center gap-2 font-semibold">
        <Link2 className="size-5 text-texto-secundario" aria-hidden /> Vincular mi Discord
      </h2>
      <p className="mt-1 text-sm text-texto-secundario">
        Recibe el rol 💪 Atleta Kaibu y los roles de racha 🔥 7+ y ⚡ 30+ días, que se actualizan solos. Solo guardamos tu usuario de Discord; puedes desvincularte cuando quieras.
      </p>

      {!disponible ? (
        <p className="mt-4 rounded-xl bg-superficie-elevada p-3 text-sm">{motivo}</p>
      ) : estado.tipo === 'cargando' ? (
        <p className="mt-4 text-sm text-texto-secundario">Revisando…</p>
      ) : estado.tipo === 'error' ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm">No pudimos revisar tu vínculo.</p>
          <Boton variante="secundario" tamano="sm" onClick={() => void revisar()}>
            Reintentar
          </Boton>
        </div>
      ) : estado.tipo === 'vinculado' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            ✅ Vinculado con <span className="font-semibold">@{estado.vinculo.discordTag ?? 'tu cuenta'}</span>
            <span className="text-texto-secundario"> · racha informada: {formatoNumero(estado.vinculo.racha)} {estado.vinculo.racha === 1 ? 'día' : 'días'}</span>
          </p>
          <Boton variante="contorno" tamano="sm" onClick={quitar}>
            <Unlink aria-hidden /> Desvincular
          </Boton>
        </div>
      ) : codigo ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm">Tu código (vence en {minutos} {minutos === 1 ? 'minuto' : 'minutos'}):</p>
          <p className="num text-center text-4xl font-bold tracking-[0.3em]" aria-label={`Código ${codigo.valor.split('').join(' ')}`}>
            {codigo.valor}
          </p>
          <ol className="list-decimal pl-5 text-sm text-texto-secundario">
            <li>Abre el Discord de Kaibu.</li>
            <li>
              Escribe <span className="font-mono text-texto">/vincular</span> y pega el código.
            </li>
            <li>Vuelve aquí: se actualiza solo.</li>
          </ol>
          <Boton variante="secundario" onClick={() => void copiar()}>
            <Copy aria-hidden /> Copiar comando
          </Boton>
        </div>
      ) : (
        <Boton className="mt-4" onClick={() => void generar()} disabled={ocupado}>
          <Link2 aria-hidden /> Generar código
        </Boton>
      )}
    </Tarjeta>
  )
}
