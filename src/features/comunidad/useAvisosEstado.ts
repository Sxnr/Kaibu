// Aviso en la app cuando el equipo cambia el estado de un reporte o sugerencia (el bot lo actualiza en Supabase).
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useReportes } from '@/data/consultas'
import { cambiosDeEstado, mapaEstados, textoCambio } from '@/domain/comunidad/avisosEstado'

const clave = (userId: string) => `kaibu:estados-envios:${userId}`

function leerVistos(userId: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(clave(userId))
    const d: unknown = raw ? JSON.parse(raw) : null
    return d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, string>) : null
  } catch {
    return null
  }
}

export function useAvisosEstado(userId: string | null) {
  const reportes = useReportes(userId)
  const navegar = useNavigate()
  useEffect(() => {
    if (!userId || !reportes) return
    const vistos = leerVistos(userId)
    // La primera vez solo se guarda lo actual (no se avisa de cambios antiguos).
    for (const c of vistos ? cambiosDeEstado(vistos, reportes) : []) {
      toast(textoCambio(c), { duration: 10_000, action: { label: 'Ver', onClick: () => navegar('/comunidad') } })
    }
    try {
      localStorage.setItem(clave(userId), JSON.stringify(mapaEstados(reportes)))
    } catch {
      // Sin almacenamiento: no hay avisos, pero la app sigue igual.
    }
  }, [userId, reportes, navegar])
}
