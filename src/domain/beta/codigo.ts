// Beta cerrada: formato del código personal y decisión de acceso (lógica pura).

/** Lo que la persona escribe o pega → mayúsculas, sin espacios ni guiones. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[\s-]/g, '')
}

/** 8 caracteres sin I, O, 0 ni 1 (los mismos que genera el bot de Discord). */
export function codigoConFormato(texto: string): boolean {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(normalizarCodigo(texto))
}

export type Acceso = 'si' | 'no' | 'cargando'

/** ¿Puede entrar a la app? null = todavía no se sabe. */
export function accesoBeta({ cerrada, tieneAcceso }: { cerrada: boolean | null; tieneAcceso: boolean | null }): Acceso {
  if (cerrada === false) return 'si'
  if (cerrada === null || tieneAcceso === null) return 'cargando'
  return tieneAcceso ? 'si' : 'no'
}
