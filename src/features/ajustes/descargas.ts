// Descarga de mis datos (RF-45): lee todo lo del usuario en el dispositivo y lo entrega como archivo.
import { db } from '@/data/db'
import { armarExportacion, archivosCsv, type DatosUsuario, type Exportacion } from '@/domain/datos/exportar'
import { hoyISO } from '@/domain/format/formato'

type FilaSync = DatosUsuario['registros'][number]

export async function exportacionDe(userId: string): Promise<Exportacion> {
  const de = (filas: object[]) => filas as FilaSync[]
  const datos: DatosUsuario = {
    perfil: ((await db.perfiles.get(userId)) as FilaSync | undefined) ?? null,
    registros: de(await db.registros.where('userId').equals(userId).toArray()),
    pesos: de(await db.pesos.where('userId').equals(userId).toArray()),
    dias: de(await db.dias.where('userId').equals(userId).toArray()),
    consentimientos: de(await db.consentimientos.where('userId').equals(userId).toArray()),
    eventos: de(await db.eventos.where('userId').equals(userId).toArray()),
    misAlimentos: de(await db.misAlimentos.where('userId').equals(userId).toArray()),
    favoritos: de(await db.favoritos.where('userId').equals(userId).toArray()),
    reportes: de(await db.reportes.where('userId').equals(userId).toArray()),
  }
  return armarExportacion(datos, new Date().toISOString())
}

function guardarArchivo(nombre: string, contenido: Blob) {
  const url = URL.createObjectURL(contenido)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const nombreBase = () => `kaibu-mis-datos-${hoyISO()}`

export async function descargarJson(userId: string): Promise<void> {
  const e = await exportacionDe(userId)
  guardarArchivo(`${nombreBase()}.json`, new Blob([JSON.stringify(e, null, 2)], { type: 'application/json' }))
}

/** Un .zip con un CSV por tabla (fflate se carga solo al usarlo). */
export async function descargarZip(userId: string): Promise<void> {
  const [{ zipSync, strToU8 }, e] = await Promise.all([import('fflate'), exportacionDe(userId)])
  const archivos = Object.fromEntries(Object.entries(archivosCsv(e)).map(([nombre, csv]) => [nombre, strToU8(csv)]))
  const zip = zipSync(archivos)
  guardarArchivo(`${nombreBase()}.zip`, new Blob([zip], { type: 'application/zip' }))
}
