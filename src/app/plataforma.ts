// Detecta si Kaibu corre como app (instalada o Android) o como sitio web en el navegador.
// En la app se salta la landing; en la web se muestra la landing a quien no tiene sesión.

interface VentanaConCapacitor {
  Capacitor?: { isNativePlatform?: () => boolean }
}

export function esApp(): boolean {
  try {
    const nativa = (window as unknown as VentanaConCapacitor).Capacitor?.isNativePlatform?.() === true
    const instalada = window.matchMedia('(display-mode: standalone)').matches
    const iosInstalada = (navigator as Navigator & { standalone?: boolean }).standalone === true
    return nativa || instalada || iosInstalada
  } catch {
    return false
  }
}
