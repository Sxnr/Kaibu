import type { ReactNode } from 'react'
import { Logotipo } from '@/components/Logo'

/** Marco común de las pantallas de cuenta (registro, entrar, recuperar). */
export function PantallaCuenta({ titulo, subtitulo, children }: { titulo: string; subtitulo?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <Logotipo />
      <div className="mt-10 flex flex-col gap-2">
        <h1 className="text-5xl">{titulo}</h1>
        {subtitulo && <p className="text-texto-secundario">{subtitulo}</p>}
      </div>
      <div className="mt-8 flex flex-col gap-5">{children}</div>
    </div>
  )
}

export function Separador() {
  return (
    <div className="flex items-center gap-3 text-sm text-texto-secundario" aria-hidden>
      <span className="h-px flex-1 bg-borde" />o<span className="h-px flex-1 bg-borde" />
    </div>
  )
}

export function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
    </svg>
  )
}
