// Crear o editar una preparación en lote (meal prep): ingredientes con gramos y en cuántas porciones se divide.
// Se guarda como receta y como "mi alimento" (una porción), para anotarla o repartirla en la semana.
import { ArrowLeft, Plus, Search, Trash2, X } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useUsuario } from '@/app/useSesion'
import { ComoSeUsa } from '@/components/ComoSeUsa'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { ALIMENTOS_CATALOGO } from '@/data/catalogo'
import { useProductos } from '@/data/catalogo/productos'
import { miAlimentoAAlimento, useMisAlimentos, useRecetas } from '@/data/consultas'
import { nuevoId, type MiAlimento, type Receta } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { buscarAlimentos } from '@/domain/alimentos/busqueda'
import type { Alimento } from '@/domain/alimentos/tipos'
import { formatoNumero, parseDecimal } from '@/domain/format/formato'
import { calcularReceta, validarReceta, type ErroresReceta, type Ingrediente } from '@/domain/plan/receta'
import { vibrar } from '@/lib/utils'

const MAX_PORCION_G = 5000

interface Fila {
  ingrediente: Ingrediente
  texto: string
}

const aIngrediente = (a: Alimento, gramos: number): Ingrediente => ({
  clave: a.clave,
  nombre: a.nombre,
  gramos,
  kcal: a.kcal,
  proteina: a.proteina,
  carbos: a.carbos,
  grasas: a.grasas,
})

export default function EditarReceta() {
  const userId = useUsuario()
  const { id } = useParams()
  const recetas = useRecetas(userId)
  const misAlimentos = useMisAlimentos(userId)
  if (!recetas || !misAlimentos) return <PantallaCargando />
  const existente = id ? recetas.find((r) => r.id === id) : undefined
  if (id && !existente) return <PantallaCargando />
  return <Formulario key={existente?.id ?? 'nueva'} userId={userId} existente={existente} misAlimentos={misAlimentos} />
}

function Formulario({ userId, existente, misAlimentos }: { userId: string; existente: Receta | undefined; misAlimentos: MiAlimento[] }) {
  const navegar = useNavigate()
  const productos = useProductos()
  const [nombre, setNombre] = useState(existente?.nombre ?? '')
  const [porcionesTexto, setPorcionesTexto] = useState(existente ? String(existente.porciones).replace('.', ',') : '5')
  const [filas, setFilas] = useState<Fila[]>(() => (existente?.ingredientes ?? []).map((i) => ({ ingrediente: i, texto: String(i.gramos).replace('.', ',') })))
  const [consulta, setConsulta] = useState('')
  const [errores, setErrores] = useState<ErroresReceta & { porcion?: string }>({})
  const buscada = useDeferredValue(consulta)

  // Se pueden usar alimentos del catálogo, productos con marca y mis alimentos (menos esta misma receta).
  const lista = useMemo(
    () => [...ALIMENTOS_CATALOGO, ...productos, ...misAlimentos.filter((m) => m.id !== existente?.alimentoId).map(miAlimentoAAlimento)],
    [productos, misAlimentos, existente?.alimentoId],
  )
  const resultados = useMemo(() => (buscada.trim().length >= 2 ? buscarAlimentos(lista, buscada, 8) : []), [lista, buscada])

  const ingredientes = filas.map((f) => ({ ...f.ingrediente, gramos: parseDecimal(f.texto) ?? 0 }))
  const porciones = parseDecimal(porcionesTexto) ?? 0
  const calculo = calcularReceta(ingredientes, porciones)

  const agregarIngrediente = (a: Alimento) => {
    const gramos = a.porcion?.g ?? 100
    setFilas((x) => [...x, { ingrediente: aIngrediente(a, gramos), texto: String(gramos).replace('.', ',') }])
    setConsulta('')
    setErrores((e) => ({ ...e, ingredientes: undefined }))
  }
  const cambiarGramos = (i: number, texto: string) => setFilas((x) => x.map((f, j) => (j === i ? { ...f, texto } : f)))
  const quitar = (i: number) => setFilas((x) => x.filter((_, j) => j !== i))

  const guardarReceta = async (e: React.FormEvent) => {
    e.preventDefault()
    const e2: ErroresReceta & { porcion?: string } = validarReceta({ nombre, porciones, ingredientes })
    if (!e2.porciones && !e2.ingredientes && calculo.porcionG > MAX_PORCION_G) e2.porcion = 'Cada porción debe pesar menos de 5 kg: sube el número de porciones'
    setErrores(e2)
    if (Object.keys(e2).length > 0) return
    const ahora = new Date().toISOString()
    const alimentoId = existente?.alimentoId ?? nuevoId()
    const previo = misAlimentos.find((m) => m.id === alimentoId)
    const alimento = await guardar('misAlimentos', {
      id: alimentoId,
      userId,
      nombre: nombre.trim(),
      marca: null,
      ...calculo.por100,
      porcionNombre: '1 porción',
      porcionG: calculo.porcionG,
      createdAt: previo?.createdAt ?? ahora,
      updatedAt: '',
      deletedAt: null,
    } satisfies MiAlimento)
    const receta = await guardar('recetas', {
      id: existente?.id ?? nuevoId(),
      userId,
      alimentoId,
      nombre: nombre.trim(),
      porciones,
      ingredientes,
      createdAt: existente?.createdAt ?? ahora,
      updatedAt: '',
      deletedAt: null,
    } satisfies Receta)
    vibrar()
    if (existente) toast('Preparación guardada')
    else
      toast(`${receta.nombre} lista: ${formatoNumero(calculo.porPorcion.kcal)} kcal por porción`, {
        action: { label: 'Deshacer', onClick: () => void Promise.all([borrar('recetas', receta), borrar('misAlimentos', alimento)]) },
      })
    navegar('/planificar', { replace: true })
  }

  const borrarReceta = async () => {
    if (!existente) return
    const alimento = misAlimentos.find((m) => m.id === existente.alimentoId)
    await borrar('recetas', existente)
    if (alimento) await borrar('misAlimentos', alimento)
    toast(`Borraste ${existente.nombre}`, {
      action: {
        label: 'Deshacer',
        onClick: () => void Promise.all([guardar('recetas', { ...existente, deletedAt: null }), alimento ? guardar('misAlimentos', { ...alimento, deletedAt: null }) : null]),
      },
    })
    navegar('/planificar', { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={() => navegar('/planificar')} aria-label="Volver a Planificar">
          <ArrowLeft aria-hidden />
        </Boton>
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl sm:text-5xl">{existente ? 'Editar preparación' : 'Nueva preparación'}</h1>
          <p className="text-sm text-texto-secundario">Meal prep: cocina una vez, come toda la semana</p>
        </div>
        <ComoSeUsa guia="receta" className="self-start" />
      </header>

      <form onSubmit={(e) => void guardarReceta(e)} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Campo etiqueta="Nombre" error={errores.nombre}>
            {(a) => <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Arroz con pollo de la semana" {...a} />}
          </Campo>
          <Campo etiqueta="Porciones" error={errores.porciones ?? errores.porcion} ayuda="En cuántos potes se divide.">
            {(a) => <Entrada inputMode="decimal" value={porcionesTexto} onChange={(e) => setPorcionesTexto(e.target.value)} className="num text-xl" {...a} />}
          </Campo>
        </div>

        <Tarjeta className="flex flex-col gap-3">
          <h2 className="font-semibold">Ingredientes de toda la preparación</h2>
          {errores.ingredientes && (
            <p role="alert" className="text-sm font-medium text-texto-marca">
              {errores.ingredientes}
            </p>
          )}
          {filas.length === 0 && <p className="text-sm text-texto-secundario">Busca abajo cada ingrediente y escribe los gramos que usas en total.</p>}
          <ul className="flex flex-col gap-2">
            {filas.map((f, i) => (
              <li key={`${f.ingrediente.clave}-${i}`} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{f.ingrediente.nombre}</span>
                <label className="sr-only" htmlFor={`gramos-${i}`}>
                  Gramos de {f.ingrediente.nombre}
                </label>
                <Entrada id={`gramos-${i}`} inputMode="decimal" value={f.texto} onChange={(e) => cambiarGramos(i, e.target.value)} className="num w-24 text-right" />
                <span className="text-sm text-texto-secundario">g</span>
                <Boton type="button" variante="fantasma" tamano="icono" onClick={() => quitar(i)} aria-label={`Quitar ${f.ingrediente.nombre}`}>
                  <X aria-hidden />
                </Boton>
              </li>
            ))}
          </ul>
          <div className="relative">
            <label htmlFor="buscar-ingrediente" className="sr-only">
              Buscar ingrediente
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-secundario" aria-hidden />
            <Entrada id="buscar-ingrediente" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Agregar ingrediente: arroz, pollo, brócoli…" className="pl-9" />
          </div>
          {resultados.length > 0 && (
            <ul className="flex flex-col" aria-label="Resultados">
              {resultados.map((a) => (
                <li key={a.clave}>
                  <button type="button" onClick={() => agregarIngrediente(a)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-superficie-elevada">
                    <Plus className="size-4 shrink-0 text-texto-marca" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.nombre}</span>
                      <span className="block truncate text-sm text-texto-secundario">
                        {a.marca ? `${a.marca} · ` : ''}
                        {formatoNumero(a.kcal)} kcal / 100 g
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-2" aria-live="polite">
          <h2 className="font-semibold">Cada porción</h2>
          <p className="text-sm text-texto-secundario">
            Total {formatoNumero(calculo.totalG)} g · porción de {formatoNumero(calculo.porcionG, calculo.porcionG % 1 ? 1 : 0)} g
          </p>
          <dl className="grid grid-cols-4 gap-2 text-center">
            {[
              { t: 'Kcal', v: formatoNumero(calculo.porPorcion.kcal) },
              { t: 'Proteína', v: `${formatoNumero(calculo.porPorcion.proteina, 1)} g` },
              { t: 'Carbos', v: `${formatoNumero(calculo.porPorcion.carbos, 1)} g` },
              { t: 'Grasas', v: `${formatoNumero(calculo.porPorcion.grasas, 1)} g` },
            ].map(({ t, v }) => (
              <div key={t} className="rounded-xl bg-superficie-elevada p-2">
                <dt className="text-xs text-texto-secundario">{t}</dt>
                <dd className="num text-lg font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>

        <Boton type="submit" ancho="completo">
          Guardar preparación
        </Boton>
        {existente && (
          <Boton type="button" variante="fantasma" ancho="completo" onClick={() => void borrarReceta()}>
            <Trash2 aria-hidden /> Borrar preparación
          </Boton>
        )}
      </form>
    </div>
  )
}
