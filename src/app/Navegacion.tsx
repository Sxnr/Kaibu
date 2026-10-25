import { BookOpen, ChartLine, Ellipsis, House, Plus, Settings, Target } from 'lucide-react'
import { NavLink } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Logotipo } from '@/components/Logo'
import { formatoNumero } from '@/domain/format/formato'
import { useSesion } from './useSesion'
import { cn } from '@/lib/utils'

interface Destino {
  a: string
  texto: string
  icono: LucideIcon
  fin?: boolean
}

const PESTANAS: Destino[] = [
  { a: '/', texto: 'Hoy', icono: House, fin: true },
  { a: '/agregar', texto: 'Agregar', icono: Plus },
  { a: '/progreso', texto: 'Progreso', icono: ChartLine },
  { a: '/mas', texto: 'Más', icono: Ellipsis },
]

const MENU: Destino[] = [
  { a: '/', texto: 'Hoy', icono: House, fin: true },
  { a: '/agregar', texto: 'Agregar', icono: Plus },
  { a: '/progreso', texto: 'Progreso', icono: ChartLine },
  { a: '/mi-plan', texto: 'Mi plan', icono: Target },
  { a: '/mis-alimentos', texto: 'Mis alimentos', icono: BookOpen },
  { a: '/ajustes', texto: 'Ajustes', icono: Settings },
]

/** Navegación inferior de 4 pestañas (celular). */
export function BarraInferior() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 backdrop-blur safe-bottom lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
        {PESTANAS.map(({ a, texto, icono: Icono, fin }) => (
          <li key={a}>
            <NavLink
              to={a}
              end={fin}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors',
                  isActive ? 'bg-marca text-sobre-marca' : 'text-texto-secundario hover:text-texto',
                )
              }
            >
              <Icono className="size-5" aria-hidden />
              {texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Menú lateral fijo (PC). */
export function MenuLateral() {
  const { perfil } = useSesion()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-borde bg-superficie px-4 py-6 lg:flex">
      <Logotipo className="px-2" />
      <nav aria-label="Principal" className="mt-8">
        <ul className="flex flex-col gap-1">
          {MENU.map(({ a, texto, icono: Icono, fin }) => (
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
                {texto}
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
