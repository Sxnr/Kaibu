import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { formatoNumero } from '@/domain/format/formato'

interface Props {
  valor: number
  decimales?: number
  className?: string
}

const suavizar = (t: number) => 1 - Math.pow(1 - t, 3)

/** Número que cuenta hacia arriba o abajo cuando cambia (con formato chileno). */
export function NumeroAnimado({ valor, decimales = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef(valor)
  const reducir = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const desde = anterior.current
    anterior.current = valor
    if (reducir || desde === valor) {
      el.textContent = formatoNumero(valor, decimales)
      return
    }
    // Animación liviana con requestAnimationFrame (600 ms).
    const inicio = performance.now()
    let cuadro = 0
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / 600)
      el.textContent = formatoNumero(desde + (valor - desde) * suavizar(t), decimales)
      if (t < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, decimales, reducir])

  return (
    <span ref={ref} className={className}>
      {formatoNumero(valor, decimales)}
    </span>
  )
}
