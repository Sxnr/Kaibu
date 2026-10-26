// Fotografías de la landing (Unsplash, licencia gratuita para uso comercial).
// Mientras no haya foto, la portada usa un fondo atmosférico de marca.

export interface Foto {
  /** Archivos en public/fotos (varios anchos para cargar solo lo necesario). */
  src: string
  srcSet: string
  alt: string
  autor: string
  enlace: string
}

export const FOTO_PORTADA: Foto | null = null
