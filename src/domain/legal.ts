// Versiones vigentes de los documentos legales (fecha de versión).
export const VERSION_TERMINOS = '2026-10-25'
export const VERSION_PRIVACIDAD = '2026-10-25'
export const VERSION_SALUD = '2026-10-25'

/** Documentos que la persona acepta al crear la cuenta. */
export type DocumentoAceptado = 'terminos' | 'datos_salud'

/**
 * Documentos con una versión más nueva que la última aceptada (RF-48).
 * Sin aceptaciones guardadas no avisa: se piden al crear la cuenta.
 */
export function documentosCambiados(
  aceptados: readonly { tipo: DocumentoAceptado; version: string }[],
  vigentes: Readonly<Record<DocumentoAceptado, string>>,
): DocumentoAceptado[] {
  const cambiados: DocumentoAceptado[] = []
  for (const tipo of Object.keys(vigentes) as DocumentoAceptado[]) {
    const versiones = aceptados.filter((a) => a.tipo === tipo).map((a) => a.version)
    if (versiones.length === 0) continue
    const ultima = versiones.reduce((a, b) => (b > a ? b : a))
    if (ultima < vigentes[tipo]) cambiados.push(tipo)
  }
  return cambiados
}
