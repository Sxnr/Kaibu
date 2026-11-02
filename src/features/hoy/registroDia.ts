import type { DiaRegistro } from '@/data/db'

/** Día sin agua ni nota (se crea al anotar lo primero). */
export const diaVacio = (userId: string, fecha: string): DiaRegistro => ({ userId, fecha, aguaMl: 0, nota: null, updatedAt: '', deletedAt: null })
