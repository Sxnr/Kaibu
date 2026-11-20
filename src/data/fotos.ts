// Fotos de progreso privadas: se comprimen en el celular, se guardan en Dexie y se suben al bucket privado.
import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { dimensionesFoto } from '@/domain/seguimiento/seguimiento'
import { db, nuevoId, type Foto } from './db'
import { guardar } from './escritura'
import { USUARIO_LOCAL } from './supabase'

export const BUCKET_FOTOS = 'fotos-progreso'
const CALIDAD_JPEG = 0.8

/** Achica la foto (máx. 1080 px por lado) y la convierte a JPEG; las fotos quedan en ~150–300 KB. */
export async function comprimirFoto(archivo: Blob): Promise<{ blob: Blob; ancho: number; alto: number }> {
  const imagen = await createImageBitmap(archivo)
  const { ancho, alto } = dimensionesFoto(imagen.width, imagen.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('Este navegador no puede procesar la foto')
  ctx.drawImage(imagen, 0, 0, ancho, alto)
  imagen.close()
  const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', CALIDAD_JPEG))
  if (!blob) throw new Error('No se pudo comprimir la foto')
  return { blob, ancho, alto }
}

/** Guarda una foto nueva: la imagen en el dispositivo y sus datos para sincronizar. */
export async function guardarFotoNueva(userId: string, fecha: string, pesoKg: number | null, archivo: Blob): Promise<Foto> {
  const { blob, ancho, alto } = await comprimirFoto(archivo)
  const id = nuevoId()
  await db.archivosFoto.put({ id, blob, subida: 0 })
  return guardar('fotos', { id, userId, fecha, pesoKg, ruta: `${userId}/${id}.jpg`, ancho, alto, createdAt: new Date().toISOString(), updatedAt: '', deletedAt: null } satisfies Foto)
}

/**
 * Sube las imágenes pendientes y quita del bucket las de fotos borradas.
 * Si algo falla queda para la próxima sincronización (nunca bloquea lo demás).
 */
export async function sincronizarFotos(cliente: SupabaseClient, userId: string): Promise<void> {
  if (userId === USUARIO_LOCAL) return
  const almacen = cliente.storage.from(BUCKET_FOTOS)
  for (const archivo of await db.archivosFoto.where('subida').equals(0).toArray()) {
    const foto = await db.fotos.get(archivo.id)
    if (!foto || foto.userId !== userId || foto.deletedAt) continue
    const { error } = await almacen.upload(foto.ruta, archivo.blob, { contentType: 'image/jpeg', upsert: true })
    if (!error) await db.archivosFoto.update(archivo.id, { subida: 1 })
  }
  // Las borradas se quitan del bucket un día después (así "Deshacer" alcanza a recuperarlas).
  const borradas = (await db.fotos.where('userId').equals(userId).toArray()).filter((f) => f.deletedAt !== null && f.deletedAt < hace(1))
  for (const foto of borradas) {
    if (!(await db.archivosFoto.get(foto.id))) continue
    const { error } = await almacen.remove([foto.ruta])
    if (!error) await db.archivosFoto.delete(foto.id)
  }
}

const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString()

/** Imagen de una foto como URL local: la del dispositivo o, si no está (otro celular), la baja del bucket. */
export function useImagenFoto(foto: Foto | undefined, cliente: SupabaseClient | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!foto) return
    let vivo = true
    let creada: string | null = null
    void (async () => {
      let archivo = await db.archivosFoto.get(foto.id)
      if (!archivo && cliente) {
        const { data } = await cliente.storage.from(BUCKET_FOTOS).download(foto.ruta)
        if (data) {
          archivo = { id: foto.id, blob: data, subida: 1 }
          await db.archivosFoto.put(archivo)
        }
      }
      if (!vivo || !archivo) return
      creada = URL.createObjectURL(archivo.blob)
      setUrl(creada)
    })()
    return () => {
      vivo = false
      if (creada) URL.revokeObjectURL(creada)
      setUrl(null)
    }
  }, [foto, cliente])
  return url
}
