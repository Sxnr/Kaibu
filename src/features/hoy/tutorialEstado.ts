// El tutorial se marca como visto por dispositivo (localStorage). Se puede volver a ver desde Más o Ajustes.
export const CLAVE_TUTORIAL = 'kaibu:tutorial-visto'

export function tutorialVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_TUTORIAL) === '1'
  } catch {
    return true
  }
}

export function marcarTutorialVisto(): void {
  try {
    localStorage.setItem(CLAVE_TUTORIAL, '1')
  } catch {
    // Sin almacenamiento (modo privado): el tutorial simplemente se cierra.
  }
}
