// Marcar o desmarcar un suplemento como tomado; si tiene kcal, se anota como comida para que sume al día.
import { toast } from 'sonner'
import { db, type Suplemento, type Toma } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import { comidaSegunHora, registroRapido } from '@/features/agregar/registrar'
import { vibrar } from '@/lib/utils'

export async function alternarToma(userId: string, s: Suplemento, fecha: string, comidas: string[], tomada: Toma | undefined): Promise<void> {
  vibrar()
  if (tomada) {
    const registro = tomada.registroId ? await db.registros.get(tomada.registroId) : undefined
    await borrar('tomas', tomada)
    if (registro) await borrar('registros', registro)
    toast(`${s.nombre}: desmarcado`, {
      action: {
        label: 'Deshacer',
        onClick: () => void Promise.all([guardar('tomas', { ...tomada, deletedAt: null }), registro ? guardar('registros', { ...registro, deletedAt: null }) : null]),
      },
    })
    return
  }
  const hora = s.hora ? Number(s.hora.slice(0, 2)) : new Date().getHours()
  const registro =
    s.kcal > 0 && comidas.length > 0
      ? await guardar('registros', registroRapido(userId, fecha, comidaSegunHora(comidas, hora), s.kcal, s.proteina, `${s.nombre}${s.dosis ? ` (${s.dosis})` : ''}`))
      : null
  const toma = await guardar('tomas', { userId, suplementoId: s.id, fecha, registroId: registro?.id ?? null, updatedAt: '', deletedAt: null } satisfies Toma)
  toast(registro ? `${s.nombre} tomado · +${registro.kcal} kcal` : `${s.nombre} tomado`, {
    action: { label: 'Deshacer', onClick: () => void Promise.all([borrar('tomas', toma), registro ? borrar('registros', registro) : null]) },
  })
}
