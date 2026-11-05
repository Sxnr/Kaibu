// Estado de los recordatorios de la Comunidad en este dispositivo (localStorage), compartido entre pantallas.
import { useSyncExternalStore } from 'react'
import { CLAVE_DESCUBRIR, ESTADO_INICIAL, leerEstado, type EstadoDescubrir } from '@/domain/comunidad/descubrir'

const oyentes = new Set<() => void>()

function leerGuardado(): EstadoDescubrir {
  try {
    return leerEstado(localStorage.getItem(CLAVE_DESCUBRIR))
  } catch {
    // Sin almacenamiento (modo privado): no insistimos con recordatorios.
    return { ...ESTADO_INICIAL, visitada: true }
  }
}

let actual: EstadoDescubrir | null = null
const obtener = (): EstadoDescubrir => (actual ??= leerGuardado())

/** Cambia el estado (inmutable) y avisa a las pantallas abiertas. */
export function actualizarDescubrir(cambio: (e: EstadoDescubrir) => EstadoDescubrir): void {
  const previo = obtener()
  const nuevo = cambio(previo)
  if (JSON.stringify(nuevo) === JSON.stringify(previo)) return
  actual = nuevo
  try {
    localStorage.setItem(CLAVE_DESCUBRIR, JSON.stringify(nuevo))
  } catch {
    // Igual queda en memoria mientras la app siga abierta.
  }
  for (const o of oyentes) o()
}

function suscribir(o: () => void) {
  oyentes.add(o)
  return () => {
    oyentes.delete(o)
  }
}

export function useDescubrirComunidad(): EstadoDescubrir {
  return useSyncExternalStore(suscribir, obtener, obtener)
}
