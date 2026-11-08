// Detecta si Kaibu corre como app (instalada o Android) o como sitio web en el navegador.
// En la app se salta la landing; en la web se muestra la landing a quien no tiene sesión.

interface VentanaConCapacitor {
  Capacitor?: { isNativePlatform?: () => boolean }
}

const CLAVE_APK = 'kaibu:apk'

// El APK (TWA) abre la web con este "referrer" solo al inicio: se recuerda durante la sesión.
try {
  if (document.referrer.startsWith('android-app://cl.kaibu.app')) sessionStorage.setItem(CLAVE_APK, '1')
} catch {
  // Sin almacenamiento: se trata como web o app instalada.
}

/** true si Kaibu se abrió desde el APK de Android. */
export function esApk(): boolean {
  try {
    const nativa = (window as unknown as VentanaConCapacitor).Capacitor?.isNativePlatform?.() === true
    return nativa || sessionStorage.getItem(CLAVE_APK) === '1'
  } catch {
    return false
  }
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

/** Sistema del celular según el navegador (para ofrecer el APK en Android o el acceso directo en iPhone). */
export function sistemaDelEquipo(userAgent: string): 'android' | 'ios' | 'otro' {
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
  return 'otro'
}
