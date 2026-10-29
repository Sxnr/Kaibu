// Registro de errores en producción (Sentry, plan gratis). Solo se activa si hay VITE_SENTRY_DSN
// y nunca envía datos personales ni de salud: sin usuario, sin IP, sin cuerpos, sin migas.

interface EventoSentry {
  message?: string
  user?: unknown
  request?: { url?: string; headers?: unknown; cookies?: unknown; data?: unknown; query_string?: unknown }
  extra?: unknown
  breadcrumbs?: unknown
}

/** Quita del evento todo lo que pueda identificar a la persona o revelar sus datos de salud. */
export function limpiarEvento<T extends EventoSentry>(evento: T): T {
  const limpio: EventoSentry = { ...evento }
  delete limpio.user
  delete limpio.extra
  delete limpio.breadcrumbs
  if (limpio.request) {
    const url = limpio.request.url?.split(/[?#]/)[0]
    limpio.request = url ? { url } : {}
  }
  return limpio as T
}

export function iniciarRegistroErrores(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()
  if (!dsn || import.meta.env.DEV) return
  // Se carga aparte para no pesar en la primera pantalla.
  void import('@sentry/browser').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      // Nada de datos de la persona: ni usuario, ni cookies, ni cabeceras, ni cuerpos, ni consultas.
      dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
      tracesSampleRate: 0,
      maxBreadcrumbs: 0,
      beforeBreadcrumb: () => null,
      beforeSend: (evento) => limpiarEvento(evento),
    })
  })
}
