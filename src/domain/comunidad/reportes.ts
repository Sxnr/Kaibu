// Reportes y sugerencias enviados desde la app al Discord de Kaibu (lógica pura, sin interfaz).

export type TipoReporte = 'bug' | 'sugerencia'
export type EstadoReporte = 'enviado' | 'publicado' | 'en_sprint' | 'resuelto' | 'planificada' | 'aprobada' | 'fuera_alcance'

/** Máximo de envíos por persona en 24 horas (el servidor aplica el mismo límite). */
export const LIMITE_DIARIO = 10

const DIA_MS = 24 * 60 * 60 * 1000

/** Plataforma sin datos personales: modo (APK, instalada o web), sistema y navegador. */
export function describirPlataforma({ userAgent, instalada, apk }: { userAgent: string; instalada: boolean; apk: boolean }): string {
  const ua = userAgent
  const sistema = /Android/.test(ua)
    ? 'Android'
    : /iPad/.test(ua)
      ? 'iPad'
      : /iPhone|iPod/.test(ua)
        ? 'iPhone'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'Mac'
            : /Linux|CrOS/.test(ua)
              ? 'Linux'
              : 'Otro sistema'
  const navegador = /Edg\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser/.test(ua)
      ? 'Samsung Internet'
      : /Firefox|FxiOS/.test(ua)
        ? 'Firefox'
        : /Chrome|CriOS/.test(ua)
          ? 'Chrome'
          : /Safari/.test(ua)
            ? 'Safari'
            : 'Otro navegador'
  const modo = apk ? 'APK' : instalada ? 'App instalada' : 'Web'
  return `${modo} · ${sistema} · ${navegador}`
}

/** Envíos (no borrados) de las últimas 24 horas. */
export function enviosUltimas24h(filas: { createdAt: string; deletedAt: string | null }[], ahora: Date = new Date()): number {
  const desde = ahora.getTime() - DIA_MS
  return filas.filter((f) => f.deletedAt === null && new Date(f.createdAt).getTime() > desde).length
}

const TEXTO_ESTADO: Record<EstadoReporte, string> = {
  enviado: 'Enviado',
  publicado: 'Publicado en Discord',
  en_sprint: 'En arreglo',
  resuelto: 'Resuelto',
  planificada: 'En la hoja de ruta',
  aprobada: 'Aprobada',
  fuera_alcance: 'Fuera de alcance por ahora',
}

/** Texto del estado. "pendienteDeSubir" = aún no sale del teléfono (sin conexión). */
export function textoEstado(estado: EstadoReporte, pendienteDeSubir: boolean): string {
  if (estado === 'enviado' && pendienteDeSubir) return 'Esperando conexión'
  return TEXTO_ESTADO[estado] ?? 'Enviado'
}

/** La racha se informa a Discord una vez al día, o antes si cambió. */
export function debeInformarRacha(ultimoInformado: string | null, hoy: string, racha: number): boolean {
  return ultimoInformado !== `${hoy}:${racha}`
}
