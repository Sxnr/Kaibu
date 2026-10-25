// Consentimientos y perfil vacío (utilidades de sesión, sin interfaz).
import { nuevoId, type Perfil, type TipoConsentimiento } from '@/data/db'
import { guardar } from '@/data/escritura'

export const CLAVE_CONSENTIMIENTO = 'kaibu:consentimiento-pendiente'

export interface ConsentimientoPendiente {
  terminos: string
  datos_salud: string
}

/** Guarda los consentimientos marcados antes de crear la cuenta (se registran al iniciar sesión). */
export function guardarConsentimientoPendiente(c: ConsentimientoPendiente): void {
  localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(c))
}

export async function registrarConsentimientos(userId: string, c: ConsentimientoPendiente): Promise<void> {
  const ahora = new Date().toISOString()
  for (const tipo of ['terminos', 'datos_salud'] as TipoConsentimiento[]) {
    await guardar('consentimientos', {
      id: nuevoId(),
      userId,
      tipo,
      version: c[tipo],
      aceptadoEn: ahora,
      updatedAt: ahora,
      deletedAt: null,
    })
  }
}

export function perfilVacio(userId: string): Perfil {
  return {
    userId,
    nombre: '',
    sexo: null,
    fechaNacimiento: null,
    estaturaCm: null,
    actividad: null,
    diasEntrenamiento: null,
    objetivo: null,
    velocidad: null,
    pesoInicial: null,
    pesoMeta: null,
    numComidas: null,
    colaciones: false,
    comidas: [],
    kcalManual: null,
    proteinaGKg: null,
    aguaMetaMl: null,
    tema: 'sistema',
    faseInicio: null,
    onboardingCompleto: false,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }
}

