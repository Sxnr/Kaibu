import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Une clases de Tailwind resolviendo conflictos. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas))
}

/** Vibración leve al completar acciones (Android). No hace nada si se pidió reducir movimiento. */
export function vibrar(ms = 12): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  navigator.vibrate?.(ms)
}
