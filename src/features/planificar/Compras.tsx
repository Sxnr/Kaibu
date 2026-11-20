// Lista de compras: suma los ingredientes de las preparaciones y lo demás planificado en un período.
import { ArrowLeft, Copy, ShoppingBasket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUsuario } from '@/app/useSesion'
import { ComoSeUsa } from '@/components/ComoSeUsa'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Casilla } from '@/components/ui/checkbox'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Opciones } from '@/components/ui/opciones'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useRecetas, useRegistrosRango } from '@/data/consultas'
import { fechaLarga, formatoNumero, hoyISO, inicioSemana, sumarDias } from '@/domain/format/formato'
import { listaCompras } from '@/domain/plan/compras'

type Periodo = 'esta' | 'proxima' | 'siete'

function rango(periodo: Periodo, hoy: string): [string, string] {
  if (periodo === 'siete') return [hoy, sumarDias(hoy, 6)]
  if (periodo === 'esta') return [hoy, sumarDias(inicioSemana(hoy), 6)]
  const lunes = sumarDias(inicioSemana(hoy), 7)
  return [lunes, sumarDias(lunes, 6)]
}

/** 1.250 g → "1,3 kg"; 300 g → "300 g". */
function cantidad(g: number): string {
  if (g < 1000) return `${formatoNumero(g)} g`
  const kg = Math.round(g / 100) / 10
  return `${formatoNumero(kg, kg % 1 ? 1 : 0)} kg`
}

function leerMarcados(clave: string): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(clave) ?? '[]') as unknown
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

export default function Compras() {
  const userId = useUsuario()
  const navegar = useNavigate()
  const hoy = hoyISO()
  const [periodo, setPeriodo] = useState<Periodo>('esta')
  const [desde, hasta] = rango(periodo, hoy)
  const registros = useRegistrosRango(userId, desde, hasta)
  const recetas = useRecetas(userId)
  const claveMarcados = `kaibu:compras:${desde}:${hasta}`
  const [marcados, setMarcados] = useState(() => ({ clave: claveMarcados, set: leerMarcados(claveMarcados) }))
  // Al cambiar de período se leen los marcados de ese período.
  const actuales = marcados.clave === claveMarcados ? marcados.set : leerMarcados(claveMarcados)

  const lista = useMemo(
    () => (registros && recetas ? listaCompras(registros, recetas.map((r) => ({ alimentoClave: `mio:${r.alimentoId}`, porciones: r.porciones, ingredientes: r.ingredientes }))) : null),
    [registros, recetas],
  )
  if (!lista) return <PantallaCargando />

  const alternar = (clave: string) => {
    const nuevo = new Set(actuales)
    if (nuevo.has(clave)) nuevo.delete(clave)
    else nuevo.add(clave)
    setMarcados({ clave: claveMarcados, set: nuevo })
    try {
      localStorage.setItem(claveMarcados, JSON.stringify([...nuevo]))
    } catch {
      // Sin almacenamiento: se marca mientras la página siga abierta.
    }
  }

  const copiar = async () => {
    const texto = [`Lista de compras Kaibu (${fechaLarga(desde)} al ${fechaLarga(hasta)})`, ...lista.filter((i) => !actuales.has(i.clave)).map((i) => `• ${i.nombre}: ${cantidad(i.gramos)}`)].join('\n')
    try {
      await navigator.clipboard.writeText(texto)
      toast('Lista copiada: pégala en WhatsApp o en tus notas')
    } catch {
      toast('No se pudo copiar en este navegador')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={() => navegar('/planificar')} aria-label="Volver a Planificar">
          <ArrowLeft aria-hidden />
        </Boton>
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl sm:text-5xl">Lista de compras</h1>
          <p className="text-sm text-texto-secundario first-letter:uppercase">
            {fechaLarga(desde)} al {fechaLarga(hasta)}
          </p>
        </div>
        <ComoSeUsa guia="compras" className="self-start" />
      </header>

      <Opciones
        etiqueta="Período"
        columnas={3}
        valor={periodo}
        alCambiar={setPeriodo}
        opciones={[
          { valor: 'esta', titulo: 'Esta semana' },
          { valor: 'proxima', titulo: 'La próxima' },
          { valor: 'siete', titulo: '7 días' },
        ]}
      />

      <Tarjeta>
        {lista.length === 0 ? (
          <EstadoVacio
            compacto
            icono={ShoppingBasket}
            titulo="No hay nada planificado en estos días"
            texto="Reparte una preparación o anota comidas en días futuros, y aquí aparece lo que tienes que comprar."
          />
        ) : (
          <>
            <ul className="flex flex-col">
              {lista.map((i) => {
                const id = `compra-${i.clave}`
                const hecho = actuales.has(i.clave)
                return (
                  <li key={i.clave} className="flex min-h-12 items-center gap-3 border-b border-borde last:border-b-0">
                    <Casilla id={id} checked={hecho} onCheckedChange={() => alternar(i.clave)} />
                    <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 py-2">
                      <span className={hecho ? 'truncate text-texto-secundario line-through' : 'truncate'}>{i.nombre}</span>
                      <span className="num shrink-0 font-semibold">{cantidad(i.gramos)}</span>
                    </label>
                    {hecho && <span className="sr-only">comprado</span>}
                  </li>
                )
              })}
            </ul>
            <Boton variante="contorno" ancho="completo" className="mt-4" onClick={() => void copiar()}>
              <Copy aria-hidden /> Copiar lista
            </Boton>
          </>
        )}
      </Tarjeta>
    </div>
  )
}
