// Comparar versiones de Kaibu ("0.2.1-beta"): sirve para avisar en la app de Android que hay un APK nuevo.

const FORMATO = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z0-9.]+))?$/i

/** true si `remota` es más nueva que `local`. Con formato raro nunca avisa. La final gana a su beta. */
export function esMasNueva(remota: string, local: string): boolean {
  const a = FORMATO.exec(remota.trim())
  const b = FORMATO.exec(local.trim())
  if (!a || !b) return false
  for (let i = 1; i <= 3; i++) {
    const diferencia = Number(a[i]) - Number(b[i])
    if (diferencia !== 0) return diferencia > 0
  }
  // Mismo número: la versión sin etiqueta (final) es más nueva que la beta.
  if (!a[4] && b[4]) return true
  return false
}
