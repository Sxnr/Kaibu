// Recordatorios (RF-36): apagados por defecto; se activan aquí y piden permiso de notificaciones.
import { BellOff, BellRing, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { estadoPermiso, guardarPreferenciasAvisos, pedirPermiso, probarAviso, usePreferenciasAvisos, type Permiso } from '@/app/avisos'
import { esNativa } from '@/app/nativo'
import { Encabezado } from '@/components/Encabezado'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { Tarjeta } from '@/components/ui/tarjeta'
import type { PreferenciasAvisos } from '@/domain/avisos/avisos'

type Tipo = 'comidas' | 'finDia' | 'inactividad' | 'agua' | 'suplementos'

const TIPOS: { clave: Tipo; titulo: string; detalle: string }[] = [
  { clave: 'comidas', titulo: 'Anota tus comidas', detalle: 'A la hora de cada comida, solo si aún no la anotas.' },
  { clave: 'finDia', titulo: 'Se te acaba el día', detalle: 'A las 20:30, si te faltan kcal para tu rango.' },
  { clave: 'inactividad', titulo: 'Varios días sin anotar', detalle: 'A los 2, 4 y 7 días sin anotar, para retomar.' },
  { clave: 'agua', titulo: 'Agua', detalle: 'A las 11:00 y 16:00, si aún no llegas a tu meta.' },
  { clave: 'suplementos', titulo: 'Suplementos', detalle: 'A la hora de cada suplemento, si no lo marcas.' },
]

function textoPermiso(permiso: Permiso, nativa: boolean): string {
  if (permiso === 'concedido') return 'Permiso de notificaciones concedido.'
  if (permiso === 'pendiente') return 'Al activarlos, se te pedirá permiso para mostrar notificaciones.'
  if (permiso === 'no-disponible') return 'Este navegador no permite notificaciones.'
  return nativa
    ? 'Las notificaciones están bloqueadas: actívalas en los Ajustes del celular → Apps → Kaibu → Notificaciones.'
    : 'Las notificaciones están bloqueadas en este navegador: permítelas desde el candado junto a la dirección de la página.'
}

export default function Recordatorios() {
  const p = usePreferenciasAvisos()
  const [permiso, setPermiso] = useState<Permiso | null>(null)
  const nativa = esNativa()
  useEffect(() => {
    void estadoPermiso().then(setPermiso)
  }, [])
  const cambiar = (cambio: Partial<PreferenciasAvisos>) => guardarPreferenciasAvisos({ ...p, ...cambio })

  const alternarGeneral = async (activar: boolean) => {
    if (!activar) {
      cambiar({ activos: false })
      toast('Recordatorios apagados')
      return
    }
    const r = await pedirPermiso()
    setPermiso(r)
    if (r !== 'concedido') return toast(textoPermiso(r, nativa))
    cambiar({ activos: true })
    toast('Recordatorios activados')
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Encabezado titulo="Recordatorios" antetitulo="Avisos que te ayudan a no olvidar" ayuda="recordatorios" />

      <Tarjeta className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Casilla id="avisos-activos" checked={p.activos} onCheckedChange={(v) => void alternarGeneral(v === true)} />
          <label htmlFor="avisos-activos" className="flex-1">
            <span className="flex items-center gap-2 font-semibold">
              {p.activos ? <BellRing className="size-5 text-texto-marca" aria-hidden /> : <BellOff className="size-5 text-texto-secundario" aria-hidden />}
              {p.activos ? 'Recordatorios activados' : 'Recordatorios apagados'}
            </span>
            {permiso && <span className="block text-sm text-texto-secundario">{textoPermiso(permiso, nativa)}</span>}
          </label>
        </div>
        {!nativa && (
          <p className="flex gap-2 rounded-xl bg-superficie-elevada p-3 text-sm">
            <Info className="size-4 shrink-0 text-texto-marca" aria-hidden />
            En la web solo pueden avisar mientras la página está abierta. Para avisos con el celular bloqueado, usa la app de Android.
          </p>
        )}
        {p.activos && (
          <Boton variante="contorno" tamano="sm" className="self-start" onClick={() => void probarAviso().then(() => toast('Te llegará un aviso de prueba en 5 segundos'))}>
            Probar un aviso
          </Boton>
        )}
      </Tarjeta>

      <Tarjeta className={p.activos ? 'flex flex-col gap-1' : 'flex flex-col gap-1 opacity-60'}>
        <h2 className="mb-2 font-semibold">Qué avisos quieres</h2>
        <ul className="flex flex-col">
          {TIPOS.map((t) => {
            const id = `aviso-${t.clave}`
            return (
              <li key={t.clave} className="flex min-h-14 items-center gap-3 border-b border-borde last:border-b-0">
                <Casilla id={id} checked={p[t.clave]} disabled={!p.activos} onCheckedChange={(v) => cambiar({ [t.clave]: v === true })} />
                <label htmlFor={id} className="flex-1 py-2">
                  <span className="block font-medium">{t.titulo}</span>
                  <span className="block text-sm text-texto-secundario">{t.detalle}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3">
        <h2 className="font-semibold">Horario de silencio</h2>
        <p className="text-sm text-texto-secundario">En este horario nunca te llega un aviso.</p>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Desde">
            {(a) => <Entrada type="time" value={p.silencioDesde} onChange={(e) => e.target.value && cambiar({ silencioDesde: e.target.value })} {...a} />}
          </Campo>
          <Campo etiqueta="Hasta">
            {(a) => <Entrada type="time" value={p.silencioHasta} onChange={(e) => e.target.value && cambiar({ silencioHasta: e.target.value })} {...a} />}
          </Campo>
        </div>
      </Tarjeta>
    </div>
  )
}
