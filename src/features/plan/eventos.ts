// Registro de eventos únicos del usuario (se guardan en el dispositivo y se sincronizan).
import type { Evento } from '@/data/db'
import { borrar, guardar } from '@/data/escritura'
import type { TipoEvento } from '@/domain/calc/semana'

export function registrarEvento(userId: string, tipo: TipoEvento, clave: string, valor: string | null, fecha: string): Promise<Evento> {
  return guardar('eventos', { userId, tipo, clave, valor, fecha, updatedAt: '', deletedAt: null })
}

/** Deshace un evento (borrado suave: el mismo evento puede volver a ocurrir). */
export function deshacerEvento(evento: Evento): Promise<Evento> {
  return borrar('eventos', evento)
}

/** Claves ya registradas de un tipo, para no repetir avisos ni celebraciones. */
export function clavesDe(eventos: Evento[] | undefined, tipo: TipoEvento): Set<string> {
  return new Set((eventos ?? []).filter((e) => e.tipo === tipo).map((e) => e.clave))
}
