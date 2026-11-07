// Descarga de datos del usuario (RF-45): un JSON con todo y un CSV por tabla para abrir en Excel.

type Fila = Record<string, unknown>
type FilaSync = Fila & { deletedAt: string | null }

export interface DatosUsuario {
  perfil: FilaSync | null
  registros: FilaSync[]
  pesos: FilaSync[]
  dias: FilaSync[]
  consentimientos: FilaSync[]
  eventos: FilaSync[]
  misAlimentos: FilaSync[]
  favoritos: FilaSync[]
  reportes: FilaSync[]
}

export interface Exportacion {
  app: 'Kaibu'
  version: 1
  exportadoEn: string
  datos: { perfil: Fila | null } & Record<Exclude<keyof DatosUsuario, 'perfil'>, Fila[]>
}

/** Quita la marca de borrado (no le sirve a la persona) y descarta lo borrado. */
const limpiar = (fila: FilaSync | null): Fila | null => {
  if (!fila || fila.deletedAt !== null) return null
  return Object.fromEntries(Object.entries(fila).filter(([k]) => k !== 'deletedAt'))
}
const limpiarLista = (filas: FilaSync[]): Fila[] => filas.map(limpiar).filter((f): f is Fila => f !== null)

export function armarExportacion(d: DatosUsuario, ahora: string): Exportacion {
  return {
    app: 'Kaibu',
    version: 1,
    exportadoEn: ahora,
    datos: {
      perfil: limpiar(d.perfil),
      registros: limpiarLista(d.registros),
      pesos: limpiarLista(d.pesos),
      dias: limpiarLista(d.dias),
      consentimientos: limpiarLista(d.consentimientos),
      eventos: limpiarLista(d.eventos),
      misAlimentos: limpiarLista(d.misAlimentos),
      favoritos: limpiarLista(d.favoritos),
      reportes: limpiarLista(d.reportes),
    },
  }
}

function celda(valor: unknown): string {
  let texto: string
  if (valor === null || valor === undefined) texto = ''
  else if (typeof valor === 'number') texto = String(valor).replace('.', ',')
  else if (typeof valor === 'boolean') texto = valor ? 'sí' : 'no'
  else if (typeof valor === 'object') texto = JSON.stringify(valor)
  else texto = String(valor)
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/** CSV para Excel en Chile: separador ";", coma decimal y BOM para que lea bien los tildes. */
export function aCsv(filas: Fila[]): string {
  const BOM = '﻿'
  if (filas.length === 0) return BOM
  const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))]
  const lineas = [columnas.join(';'), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(';'))]
  return BOM + lineas.map((l) => `${l}\r\n`).join('')
}

/** Un archivo CSV por tabla (nombre → contenido). */
export function archivosCsv(e: Exportacion): Record<string, string> {
  const archivos: Record<string, string> = {}
  for (const [nombre, valor] of Object.entries(e.datos)) {
    const filas = Array.isArray(valor) ? valor : valor ? [valor] : []
    archivos[`${nombre}.csv`] = aCsv(filas)
  }
  return archivos
}
