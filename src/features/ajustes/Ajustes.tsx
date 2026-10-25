import { BookOpen, ChevronRight, FileText, LogOut, Monitor, Moon, RefreshCw, Sun, Target, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EstadoSyncTexto } from '@/app/Navegacion'
import { useSesion } from '@/app/useSesion'
import { aplicarTema } from '@/app/tema'
import { Encabezado } from '@/components/Encabezado'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Opciones } from '@/components/ui/opciones'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { Tema } from '@/data/db'
import { guardar } from '@/data/escritura'

export function FilaEnlace({ a, icono: Icono, texto, detalle }: { a: string; icono: LucideIcon; texto: string; detalle?: string }) {
  return (
    <li>
      <Link to={a} className="flex min-h-14 items-center gap-3 rounded-xl px-3 hover:bg-superficie-elevada">
        <Icono className="size-5 text-texto-secundario" aria-hidden />
        <span className="flex-1">
          <span className="block font-medium">{texto}</span>
          {detalle && <span className="block text-sm text-texto-secundario">{detalle}</span>}
        </span>
        <ChevronRight className="size-5 text-texto-secundario" aria-hidden />
      </Link>
    </li>
  )
}

export default function Ajustes() {
  const { perfil, email, modoLocal, pendientes, enLinea, sincronizarAhora, sincronizando, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  if (!perfil) return <PantallaCargando />

  const cambiarTema = async (tema: Tema) => {
    aplicarTema(tema)
    await guardar('perfiles', { ...perfil, tema })
  }

  const salir = async () => {
    if (pendientes > 0 && !enLinea && !confirmarSalida) return setConfirmarSalida(true)
    await cerrarSesion()
    navegar('/entrar', { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Encabezado titulo="Ajustes" antetitulo={modoLocal ? 'Modo local (sin cuenta)' : email ?? undefined} />

      <Tarjeta>
        <h2 className="font-semibold">Tema</h2>
        <p className="mb-3 text-sm text-texto-secundario">Se recuerda en tu cuenta.</p>
        <Opciones
          etiqueta="Tema"
          valor={perfil.tema}
          alCambiar={(t) => void cambiarTema(t)}
          columnas={3}
          opciones={[
            { valor: 'claro', titulo: 'Claro', icono: <Sun aria-hidden /> },
            { valor: 'oscuro', titulo: 'Oscuro', icono: <Moon aria-hidden /> },
            { valor: 'sistema', titulo: 'Sistema', icono: <Monitor aria-hidden /> },
          ]}
          className="max-sm:grid-cols-1"
        />
      </Tarjeta>

      <Tarjeta className="p-2">
        <ul>
          <FilaEnlace a="/ajustes/perfil" icono={UserRound} texto="Perfil y datos físicos" detalle="Objetivo, fase, comidas del día" />
          <FilaEnlace a="/mi-plan" icono={Target} texto="Mi plan" detalle="Kcal, macros y reparto" />
          <FilaEnlace a="/mis-alimentos" icono={BookOpen} texto="Mis alimentos" />
        </ul>
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Sincronización</h2>
            <EstadoSyncTexto />
          </div>
          {!modoLocal && (
            <Boton variante="secundario" tamano="sm" onClick={sincronizarAhora} disabled={sincronizando || !enLinea}>
              <RefreshCw className={sincronizando ? 'motion-safe:animate-spin' : ''} aria-hidden /> Sincronizar
            </Boton>
          )}
        </div>
      </Tarjeta>

      <Tarjeta className="p-2">
        <h2 className="rotulo px-3 pt-2">Legal</h2>
        <ul>
          <FilaEnlace a="/legal/terminos" icono={FileText} texto="Términos y Condiciones" />
          <FilaEnlace a="/legal/privacidad" icono={FileText} texto="Política de Privacidad" />
          <FilaEnlace a="/legal/salud" icono={FileText} texto="Aviso de salud" />
        </ul>
      </Tarjeta>

      {confirmarSalida && (
        <p role="alert" className="rounded-2xl border border-alerta/50 bg-superficie p-4 text-sm">
          Tienes {pendientes} cambios sin subir y no hay internet. Si cierras sesión ahora se perderán. Conéctate y espera unos segundos, o toca de
          nuevo para cerrar igual.
        </p>
      )}
      <Boton variante="peligro" ancho="completo" onClick={() => void salir()}>
        <LogOut aria-hidden /> {confirmarSalida ? 'Cerrar sesión igual' : modoLocal ? 'Salir y borrar datos de este dispositivo' : 'Cerrar sesión'}
      </Boton>
      {modoLocal && <p className="-mt-3 text-center text-sm text-texto-secundario">En modo local, salir borra tus registros de este dispositivo.</p>}
    </div>
  )
}
