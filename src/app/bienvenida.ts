// Preferencias simples del dispositivo para el flujo de bienvenida.
export const CLAVE_BIENVENIDA = 'kaibu:bienvenida-vista'

export function bienvenidaVista(): boolean {
  try {
    return localStorage.getItem(CLAVE_BIENVENIDA) === '1'
  } catch {
    return false
  }
}
