import { BookOpen, ChartLine, Ellipsis, House, MessagesSquare, Plus, Settings, Target } from 'lucide-react'
import { NavLink } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Logotipo } from '@/components/Logo'
import { formatoNumero } from '@/domain/format/formato'
import { mostrarNuevo } from '@/domain/comunidad/descubrir'
import { useDescubrirComunidad } from '@/features/comunidad/descubrirEstado'
import { useSesion } from './useSesion'
import { cn } from '@/lib/utils'

interface Destino {
  a: string
  texto: string
  icono: LucideIcon
  fin?: boolean
  /** Muestra "Nuevo" hasta que la persona visita la Comunidad. */
  nuevo?: boolean
}

const PESTANAS: Destino[] = [
  { a: '/', texto: 'Hoy', icono: House, fin: true },
  { a: '/agregar', texto: 'Agregar', icono: Plus },
  { a: '/progreso', texto: 'Progreso', icono: ChartLine },
  { a: '/mas', texto: 'Más', icono: Ellipsis, nuevo: true },
]

const MENU: Destino[] = [
  { a: '/', texto: 'Hoy', icono: House, fin: true },
  { a: '/agregar', texto: 'Agregar', icono: Plus },
  { a: '/progreso', texto: 'Progreso', icono: ChartLine },
  { a: '/mi-plan', texto: 'Mi plan', icono: Target },
  { a: '/mis-alimentos', texto: 'Mis alimentos', icono: BookOpen },
  { a: '/comunidad', texto: 'Comunidad', icono: MessagesSquare, nuevo: true },
  { a: '/ajustes', texto: 'Ajustes', icono: Settings },
]

/** Navegación inferior de 4 pestañas (celular). */
export function BarraInferior() {
  const hayNuevo = mostrarNuevo(useDescubrirComunidad())
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 backdrop-blur safe-bottom lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
        {PESTANAS.map(({ a, texto, icono: Icono, fin, nuevo }) => (
          <li key={a}>
            <NavLink
              to={a}
              end={fin}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors',
                  isActive ? 'bg-marca text-sobre-marca' : 'text-texto-secundario hover:text-texto',
                )
              }
            >
              <Icono className="size-5" aria-hidden />
              {texto}
              {nuevo && hayNuevo && <PuntoNuevo />}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Punto sobre la pestaña "Más" (celular): la Comunidad es nueva para esta persona. Con texto para lectores de pantalla. */
function PuntoNuevo() {
  return (
    <>
      <span className="absolute top-1.5 right-[calc(50%-1.1rem)] size-2.5 rounded-full bg-marca ring-2 ring-superficie" aria-hidden />
      <span className="sr-only"> (tiene algo nuevo: Comunidad)</span>
    </>
  )
}

/** Etiqueta "Nuevo" (texto, no solo color). */
export function InsigniaNuevo() {
  return <span className="rounded-full bg-superficie-elevada px-2 py-0.5 text-[0.7rem] font-semibold text-texto-marca ring-1 ring-borde">Nuevo</span>
}

/** Menú lateral fijo (PC). */
export function MenuLateral() {
  const { perfil } = useSesion()
  const hayNuevo = mostrarNuevo(useDescubrirComunidad())
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-borde bg-superficie px-4 py-6 lg:flex">
      <Logotipo className="px-2" />
      <nav aria-label="Principal" className="mt-8">
        <ul className="flex flex-col gap-1">
          {MENU.map(({ a, texto, icono: Icono, fin, nuevo }) => (
            <li key={a}>
              <NavLink
                to={a}
                end={fin}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-marca text-sobre-marca' : 'text-texto-secundario hover:bg-superficie-elevada hover:text-texto',
                  )
                }
              >
                <Icono className="size-5" aria-hidden />
                <span className="flex-1">{texto}</span>
                {nuevo && hayNuevo && <InsigniaNuevo />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {perfil?.objetivo && perfil.pesoInicial && (
        <div className="mt-auto rounded-2xl border border-borde bg-superficie-elevada p-4">
          <p className="rotulo">Fase actual</p>
          <p className="mt-1 text-sm font-semibold">
            {perfil.objetivo === 'perder' ? 'Déficit' : perfil.objetivo === 'ganar' ? 'Volumen' : 'Mantenimiento'}
            {perfil.objetivo !== 'mantener' && perfil.pesoMeta && (
              <>
                {' · '}
                <span className="num">{formatoNumero(perfil.pesoInicial, 1)}</span> →{' '}
                <span className="num">{formatoNumero(perfil.pesoMeta, 1)}</span> kg
              </>
            )}
          </p>
          <EstadoSyncTexto />
        </div>
      )}
    </aside>
  )
}

export function EstadoSyncTexto() {
  const { modoLocal, enLinea, pendientes, sincronizando, errorSync } = useSesion()
  const texto = modoLocal
    ? 'Modo local: datos solo en este dispositivo'
    : !enLinea
      ? `Sin conexión${pendientes ? ` · ${pendientes} cambios por subir` : ''}`
      : sincronizando
        ? 'Sincronizando…'
        : errorSync
          ? errorSync
          : pendientes
            ? `${pendientes} cambios por subir`
            : 'Sincronizado con tu cuenta'
  return (
    <p className="mt-1 text-xs text-texto-secundario" role="status" aria-live="polite">
      {texto}
    </p>
  )
}
