// Recalcula y reprograma los recordatorios cada vez que cambian los datos (p. ej. al anotar el almuerzo
// se cancela su aviso). Se programan los avisos de hoy y de los próximos días; nada suena sin permiso.
import { useEffect } from 'react'
import { useDia, useEventos, usePesos, useRegistrosRango, useSuplementos, useTomasDia } from '@/data/consultas'
import { planificarAvisos, type EstadoAvisos } from '@/domain/avisos/avisos'
import { sumarNutrientes } from '@/domain/calc/dia'
import { hoyISO, sumarDias } from '@/domain/format/formato'
import { usePlan } from '@/features/plan/usePlan'
import { programarAvisos, usePreferenciasAvisos } from './avisos'
import { useSesion } from './useSesion'

const ESPERA_MS = 1500

export function useProgramarAvisos(userId: string | null) {
  const preferencias = usePreferenciasAvisos()
  const { perfil } = useSesion()
  const hoy = hoyISO()
  const registros = useRegistrosRango(userId, sumarDias(hoy, -30), sumarDias(hoy, 3))
  const pesos = usePesos(userId)
  const eventos = useEventos(userId)
  const dia = useDia(userId, hoy)
  const suplementos = useSuplementos(userId)
  const tomas = useTomasDia(userId, hoy)
  const { plan } = usePlan(perfil, pesos, eventos)

  useEffect(() => {
    if (!perfil || !registros || !plan || dia === undefined || !suplementos || !tomas) return
    const t = window.setTimeout(() => {
      const comidasPorFecha: Record<string, Set<string>> = {}
      for (const r of registros) (comidasPorFecha[r.fecha] ??= new Set()).add(r.comida)
      const pasados = registros.filter((r) => r.fecha <= hoy).map((r) => r.fecha).sort()
      const ahora = new Date()
      const estado: EstadoAvisos = {
        hoy,
        horaActual: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
        comidas: perfil.comidas.map((c) => ({ id: c.id, nombre: c.nombre })),
        comidasPorFecha,
        kcalHoy: sumarNutrientes(registros.filter((r) => r.fecha === hoy)).kcal,
        kcalMinima: plan.rango.min,
        ultimoDiaConRegistro: pasados.at(-1) ?? null,
        aguaHoyMl: dia?.aguaMl ?? 0,
        aguaMetaMl: plan.aguaMl,
        suplementos: suplementos.filter((s) => s.activo).map((s) => ({ id: s.id, nombre: s.nombre, hora: s.hora, tomadoHoy: tomas.has(s.id) })),
      }
      void programarAvisos(planificarAvisos(preferencias, estado)).catch(() => undefined)
    }, ESPERA_MS)
    return () => window.clearTimeout(t)
  }, [preferencias, perfil, registros, plan, dia, suplementos, tomas, hoy])
}
