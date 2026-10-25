import { ArrowLeft, BookPlus, Copy, History, Search, Star, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useSesion, useUsuario } from '@/app/useSesion'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Entrada } from '@/components/ui/campo'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { ALIMENTOS_CATALOGO } from '@/data/catalogo'
import { miAlimentoAAlimento, useFavoritos, useMisAlimentos, useRecientes, useRegistrosDia } from '@/data/consultas'
import type { RegistroComida } from '@/data/db'
import { borrar, guardar, guardarVarios } from '@/data/escritura'
import { buscarAlimentos } from '@/domain/alimentos/busqueda'
import type { Alimento } from '@/domain/alimentos/tipos'
import { fechaLarga, formatoNumero, hoyISO, sumarDias } from '@/domain/format/formato'
import { cn, vibrar } from '@/lib/utils'
import { AgregarRapido } from './AgregarRapido'
import { CopiarAyer } from './CopiarAyer'
import { FichaAlimento } from './FichaAlimento'
import { FilaAlimento } from './FilaAlimento'
import { comidaSegunHora, copiarRegistros, nuevoRegistro, registroRapido, type ModoCantidad } from './registrar'

const MAPA_CATALOGO = new Map(ALIMENTOS_CATALOGO.map((a) => [a.clave, a]))

export default function Agregar() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const [params, setParams] = useSearchParams()
  const hoy = hoyISO()
  const fecha = params.get('fecha') && params.get('fecha')! <= hoy ? params.get('fecha')! : hoy
  const comidas = perfil?.comidas ?? []
  const comidaId = comidas.some((c) => c.id === params.get('comida')) ? params.get('comida')! : comidaSegunHora(comidas.map((c) => c.id))
  const comida = comidas.find((c) => c.id === comidaId) ?? comidas[0]
  const [consulta, setConsulta] = useState(params.get('q') ?? '')
  const [ficha, setFicha] = useState<{ alimento: Alimento | null; abierta: boolean }>({ alimento: null, abierta: false })
  const [rapido, setRapido] = useState(false)
  const [copiar, setCopiar] = useState(false)

  const misAlimentos = useMisAlimentos(userId)
  const favoritos = useFavoritos(userId)
  const recientes = useRecientes(userId)
  const registrosAyer = useRegistrosDia(userId, sumarDias(fecha, -1))

  const misComoAlimento = useMemo(() => (misAlimentos ?? []).map(miAlimentoAAlimento), [misAlimentos])
  const porClave = useMemo(() => new Map<string, Alimento>([...MAPA_CATALOGO, ...misComoAlimento.map((a) => [a.clave, a] as const)]), [misComoAlimento])

  const listaFavoritos = useMemo(() => [...(favoritos ?? [])].map((c) => porClave.get(c)).filter((a): a is Alimento => !!a), [favoritos, porClave])
  const listaRecientes = useMemo(
    () =>
      (recientes ?? [])
        .map((r) => ({ registro: r, alimento: r.alimentoClave ? porClave.get(r.alimentoClave) : undefined }))
        .filter((x): x is { registro: RegistroComida; alimento: Alimento } => !!x.alimento),
    [recientes, porClave],
  )

  // Resultados de búsqueda sin duplicados: favoritos → recientes → mis alimentos → catálogo.
  const resultados = useMemo(() => {
    if (!consulta.trim()) return null
    const vistos = new Set<string>()
    const tomar = (lista: Alimento[]) =>
      buscarAlimentos(lista, consulta).filter((a) => {
        if (vistos.has(a.clave)) return false
        vistos.add(a.clave)
        return true
      })
    return [
      { titulo: 'Favoritos', lista: tomar(listaFavoritos) },
      { titulo: 'Recientes', lista: tomar(listaRecientes.map((x) => x.alimento)) },
      { titulo: 'Mis alimentos', lista: tomar(misComoAlimento) },
      { titulo: 'Catálogo', lista: tomar(ALIMENTOS_CATALOGO) },
    ].filter((g) => g.lista.length > 0)
  }, [consulta, listaFavoritos, listaRecientes, misComoAlimento])

  if (!perfil || !comida || !misAlimentos || !favoritos || !recientes || !registrosAyer) return <PantallaCargando />

  const avisarAgregado = (nuevos: RegistroComida[], texto: string) => {
    vibrar()
    toast(texto, {
      action: { label: 'Deshacer', onClick: () => void Promise.all(nuevos.map((r) => borrar('registros', r))) },
    })
  }

  const agregarDesdeFicha = async (alimento: Alimento, modo: ModoCantidad, cantidad: number) => {
    const r = nuevoRegistro({ userId, fecha, comida: comida.id, alimento, modo, cantidad })
    await guardar('registros', r)
    setFicha((f) => ({ ...f, abierta: false }))
    avisarAgregado([r], `${alimento.nombre} agregado a ${comida.nombre} · ${formatoNumero(r.kcal)} kcal`)
  }

  const repetirReciente = async (anterior: RegistroComida) => {
    const [r] = copiarRegistros([anterior], fecha, comida.id)
    await guardar('registros', r!)
    avisarAgregado([r!], `${anterior.nombre} agregado a ${comida.nombre}`)
  }

  const alternarFavorito = async (a: Alimento) => {
    const es = favoritos.has(a.clave)
    await guardar('favoritos', { userId, alimentoClave: a.clave, updatedAt: '', deletedAt: es ? new Date().toISOString() : null })
    toast(es ? 'Quitado de favoritos' : 'Agregado a favoritos')
  }

  const copiarDeAyer = async (lista: RegistroComida[], destino?: string) => {
    const nuevos = copiarRegistros(lista, fecha, destino)
    await guardarVarios('registros', nuevos)
    setCopiar(false)
    avisarAgregado(nuevos, `Copiaste ${nuevos.length} ${nuevos.length === 1 ? 'alimento' : 'alimentos'} de ayer`)
  }

  const guardarRapido = async (kcal: number, proteina: number, nombre: string) => {
    const r = registroRapido(userId, fecha, comida.id, kcal, proteina, nombre)
    await guardar('registros', r)
    setRapido(false)
    avisarAgregado([r], `${formatoNumero(r.kcal)} kcal agregadas a ${comida.nombre}`)
  }

  const abrir = (a: Alimento) => setFicha({ alimento: a, abierta: true })
  const cambiarComida = (id: string) => {
    const p = new URLSearchParams(params)
    p.set('comida', id)
    setParams(p, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={() => navegar(fecha === hoy ? '/' : `/?fecha=${fecha}`)} aria-label="Volver a Hoy">
          <ArrowLeft aria-hidden />
        </Boton>
        <div>
          <h1 className="text-4xl sm:text-5xl">Agregar</h1>
          <p className="text-sm text-texto-secundario first-letter:uppercase">{fecha === hoy ? 'Hoy' : fechaLarga(fecha)}</p>
        </div>
      </header>

      <div role="radiogroup" aria-label="Comida" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {comidas.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === comida.id}
            onClick={() => cambiarComida(c.id)}
            className={cn(
              'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
              c.id === comida.id ? 'border-marca bg-marca text-sobre-marca' : 'border-borde bg-superficie text-texto-secundario hover:text-texto',
            )}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div role="search" className="relative">
        <label htmlFor="buscar-alimento" className="sr-only">
          Buscar alimento
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-secundario" aria-hidden />
        <Entrada
          id="buscar-alimento"
          type="search"
          autoComplete="off"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Busca: marraqueta, pollo, palta…"
          className="min-h-14 pl-12 text-lg"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { texto: 'Agregar rápido', icono: Zap, accion: () => setRapido(true) },
          { texto: 'Copiar de ayer', icono: Copy, accion: () => setCopiar(true) },
          { texto: 'Crear alimento', icono: BookPlus, accion: () => navegar('/mis-alimentos/nuevo?volver=agregar') },
        ].map(({ texto, icono: Icono, accion }) => (
          <button
            key={texto}
            type="button"
            onClick={accion}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-borde bg-superficie p-2 text-center text-sm font-medium hover:bg-superficie-elevada motion-safe:active:scale-[0.98]"
          >
            <Icono className="size-5 text-texto-marca" aria-hidden />
            {texto}
          </button>
        ))}
      </div>

      {resultados ? (
        resultados.length === 0 ? (
          <EstadoVacio
            icono={Search}
            titulo="Sin resultados"
            texto={`No encontramos "${consulta}". Prueba con otra palabra, usa "Agregar rápido" o créalo en Mis alimentos.`}
            accion={
              <Boton asChild variante="secundario">
                <Link to={`/mis-alimentos/nuevo?volver=agregar&nombre=${encodeURIComponent(consulta)}`}>Crear "{consulta}"</Link>
              </Boton>
            }
          />
        ) : (
          <div className="flex flex-col gap-4" aria-live="polite">
            {resultados.map((g) => (
              <Tarjeta key={g.titulo} className="p-2 sm:p-3">
                <h2 className="rotulo px-2 pt-2">{g.titulo}</h2>
                <ul className="mt-1">
                  {g.lista.map((a) => (
                    <FilaAlimento key={a.clave} alimento={a} favorito={favoritos.has(a.clave)} alAbrir={() => abrir(a)} />
                  ))}
                </ul>
              </Tarjeta>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Tarjeta className="p-2 sm:p-3">
            <h2 className="rotulo flex items-center gap-1.5 px-2 pt-2">
              <History className="size-4" aria-hidden /> Recientes
            </h2>
            {listaRecientes.length === 0 ? (
              <EstadoVacio compacto className="m-2 border-none" icono={History} titulo="Sin recientes" texto="Lo que registres aparecerá aquí para repetirlo con un toque." />
            ) : (
              <ul className="mt-1">
                {listaRecientes.slice(0, 12).map(({ registro, alimento }) => (
                  <FilaAlimento
                    key={alimento.clave}
                    alimento={alimento}
                    detalle={`${registro.unidad} · ${formatoNumero(registro.kcal)} kcal`}
                    favorito={favoritos.has(alimento.clave)}
                    alAbrir={() => abrir(alimento)}
                    alAgregarDirecto={() => void repetirReciente(registro)}
                  />
                ))}
              </ul>
            )}
          </Tarjeta>
          <div className="flex flex-col gap-4">
            <Tarjeta className="p-2 sm:p-3">
              <h2 className="rotulo flex items-center gap-1.5 px-2 pt-2">
                <Star className="size-4" aria-hidden /> Favoritos
              </h2>
              {listaFavoritos.length === 0 ? (
                <EstadoVacio compacto className="m-2 border-none" icono={Star} titulo="Sin favoritos" texto="Toca la estrella en la ficha de un alimento para tenerlo siempre a mano." />
              ) : (
                <ul className="mt-1">
                  {listaFavoritos.map((a) => (
                    <FilaAlimento key={a.clave} alimento={a} favorito alAbrir={() => abrir(a)} />
                  ))}
                </ul>
              )}
            </Tarjeta>
            <Tarjeta className="p-2 sm:p-3">
              <h2 className="rotulo flex items-center gap-1.5 px-2 pt-2">
                <BookPlus className="size-4" aria-hidden /> Mis alimentos
              </h2>
              {misComoAlimento.length === 0 ? (
                <EstadoVacio
                  compacto
                  className="m-2 border-none"
                  icono={BookPlus}
                  titulo="Aún no creas alimentos"
                  texto="Crea los que comes seguido (tu pan de la esquina, tu batido) con sus valores por 100 g."
                />
              ) : (
                <ul className="mt-1">
                  {misComoAlimento.map((a) => (
                    <FilaAlimento key={a.clave} alimento={a} favorito={favoritos.has(a.clave)} alAbrir={() => abrir(a)} />
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>
        </div>
      )}

      <FichaAlimento
        alimento={ficha.alimento}
        abierta={ficha.abierta}
        alCambiar={(v) => setFicha((f) => ({ ...f, abierta: v }))}
        nombreComida={comida.nombre}
        esFavorito={!!ficha.alimento && favoritos.has(ficha.alimento.clave)}
        alAlternarFavorito={(a) => void alternarFavorito(a)}
        alAgregar={(a, m, c) => void agregarDesdeFicha(a, m, c)}
      />
      <AgregarRapido abierta={rapido} alCambiar={setRapido} nombreComida={comida.nombre} alGuardar={(k, p, n) => void guardarRapido(k, p, n)} />
      <CopiarAyer abierta={copiar} alCambiar={setCopiar} registrosAyer={registrosAyer} comidas={comidas} comidaDestino={comida} alCopiar={(l, d) => void copiarDeAyer(l, d)} />
    </div>
  )
}
