// Funciones de apoyo para las animaciones y estilos compartidos.
import type { CSSProperties } from 'react'
import { Easing, interpolate } from 'remotion'
import { C, DISPLAY, SANS } from './tema'

export const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const mezclar = (a: number, b: number, p: number) => a + (b - a) * p
export const suave = (frame: number, desde: number, dur: number) =>
  interpolate(frame, [desde, desde + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1) })
export const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const decimal = (n: number, d = 1) => n.toFixed(d).replace('.', ',')

export const rotulo = (k: number): CSSProperties => ({
  fontFamily: SANS,
  fontSize: 12 * k,
  fontWeight: 650,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: C.secundario,
})

export const numero = (k: number, tam: number, color: string = C.texto): CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: 700,
  fontSize: tam * k,
  lineHeight: 1,
  color,
})
