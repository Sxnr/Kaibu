// Versiones vigentes de los documentos legales (fecha de versión).
export const VERSION_TERMINOS = '2026-11-02'
export const VERSION_PRIVACIDAD = '2026-11-02'
export const VERSION_SALUD = '2026-10-25'

/** Documentos que la persona acepta al crear la cuenta. */
export type DocumentoAceptado = 'terminos' | 'datos_salud'

/** El consentimiento de datos de salud cubre la Política de Privacidad y el Aviso de salud: vale la más nueva. */
export const VERSION_DATOS_SALUD = VERSION_PRIVACIDAD > VERSION_SALUD ? VERSION_PRIVACIDAD : VERSION_SALUD

export const VERSIONES_VIGENTES: Readonly<Record<DocumentoAceptado, string>> = {
  terminos: VERSION_TERMINOS,
  datos_salud: VERSION_DATOS_SALUD,
}

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
