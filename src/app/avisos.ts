// Notificaciones (RF-36). En el APK usa las notificaciones de Android (suenan con el celular bloqueado).
// En la web solo pueden avisar mientras la página está abierta. Nada se programa sin permiso.
import { useSyncExternalStore } from 'react'
import { CLAVE_PREFERENCIAS_AVISOS, leerPreferencias, type Aviso, type PreferenciasAvisos } from '@/domain/avisos/avisos'
import { desdeISO } from '@/domain/format/formato'
import { esNativa } from './nativo'

export type Permiso = 'concedido' | 'denegado' | 'pendiente' | 'no-disponible'

// Se devuelve el MÓDULO, nunca el plugin: el plugin de Capacitor es un Proxy y, si se entrega desde una
// promesa, JavaScript le pide ".then" y falla ("LocalNotifications.then() is not implemented on android").
const cargarModulo = () => import('@capacitor/local-notifications')

export async function estadoPermiso(): Promise<Permiso> {
  if (esNativa()) {
    const { display } = await (await cargarModulo()).LocalNotifications.checkPermissions()
    return display === 'granted' ? 'concedido' : display === 'denied' ? 'denegado' : 'pendiente'
  }
  if (typeof Notification === 'undefined') return 'no-disponible'
  return Notification.permission === 'granted' ? 'concedido' : Notification.permission === 'denied' ? 'denegado' : 'pendiente'
}

export async function pedirPermiso(): Promise<Permiso> {
  if (esNativa()) {
    const { display } = await (await cargarModulo()).LocalNotifications.requestPermissions()
    return display === 'granted' ? 'concedido' : 'denegado'
  }
  if (typeof Notification === 'undefined') return 'no-disponible'
  const r = await Notification.requestPermission()
  return r === 'granted' ? 'concedido' : r === 'denied' ? 'denegado' : 'pendiente'
}

/** Fecha y hora local del aviso. */
const momento = (a: Aviso) => {
  const f = desdeISO(a.fecha)
  const [h, m] = a.hora.split(':').map(Number) as [number, number]
  f.setHours(h, m, 0, 0)
  return f
}

// En la web: temporizadores mientras la página siga abierta (como máximo las próximas 12 horas).
let temporizadores: number[] = []
const HORIZONTE_WEB_MS = 12 * 3_600_000

/** Reemplaza todo lo programado por la lista nueva. */
export async function programarAvisos(avisos: Aviso[]): Promise<void> {
  if (esNativa()) {
    const { LocalNotifications: plugin } = await cargarModulo()
    const { display } = await plugin.checkPermissions()
    if (display !== 'granted') return
    const pendientes = await plugin.getPending()
    if (pendientes.notifications.length > 0) await plugin.cancel({ notifications: pendientes.notifications.map((n) => ({ id: n.id })) })
    if (avisos.length === 0) return
    await plugin.schedule({
      notifications: avisos.map((a) => ({ id: a.id, title: a.titulo, body: a.cuerpo, schedule: { at: momento(a), allowWhileIdle: true }, extra: { ruta: '/' } })),
    })
    return
  }
  for (const t of temporizadores) window.clearTimeout(t)
  temporizadores = []
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const ahora = Date.now()
  for (const a of avisos) {
    const espera = momento(a).getTime() - ahora
    if (espera <= 0 || espera > HORIZONTE_WEB_MS) continue
    temporizadores.push(window.setTimeout(() => new Notification(a.titulo, { body: a.cuerpo, icon: '/icons/icon-192.png' }), espera))
  }
}

/** Notificación de prueba en 5 segundos. */
export async function probarAviso(): Promise<void> {
  const titulo = 'Así se ven los avisos de Kaibu'
  const cuerpo = 'Solo te avisamos lo que falta, y nunca en tu horario de silencio.'
  if (esNativa()) {
    await (await cargarModulo()).LocalNotifications.schedule({ notifications: [{ id: 1, title: titulo, body: cuerpo, schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true } }] })
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') window.setTimeout(() => new Notification(titulo, { body: cuerpo, icon: '/icons/icon-192.png' }), 5000)
}

// Preferencias del dispositivo (los avisos son de cada celular), compartidas entre pantallas.
const oyentes = new Set<() => void>()
let actuales: PreferenciasAvisos | null = null

function leer(): PreferenciasAvisos {
  try {
    return leerPreferencias(localStorage.getItem(CLAVE_PREFERENCIAS_AVISOS))
  } catch {
    return leerPreferencias(null)
  }
}

export function guardarPreferenciasAvisos(p: PreferenciasAvisos): void {
  actuales = p
  try {
    localStorage.setItem(CLAVE_PREFERENCIAS_AVISOS, JSON.stringify(p))
  } catch {
    // Sin almacenamiento: vale mientras la app siga abierta.
  }
  for (const o of oyentes) o()
}

export function usePreferenciasAvisos(): PreferenciasAvisos {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => oyentes.delete(o)
    },
    () => (actuales ??= leer()),
  )
}
