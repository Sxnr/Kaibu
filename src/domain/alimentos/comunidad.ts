// Catálogo colaborativo: códigos de barras, validación de lo que aporta una persona desde la etiqueta
// y cómo se explica el estado de verificación. Funciones puras (sin acceso a datos).

/** "780 2500-222189" → "7802500222189". */
export function limpiarCodigo(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** EAN-8, UPC-A (12), EAN-13 o GTIN-14 con su dígito verificador correcto. */
export function codigoValido(codigo: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(codigo)) return false
  const digitos = [...codigo].map(Number)
  const verificador = digitos.pop()!
  // Desde la derecha, los dígitos se multiplican alternando por 3 y por 1.
  const suma = digitos.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (suma % 10)) % 10 === verificador
}

export interface DatosAporte {
  codigo: string
  nombre: string
  marca: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcionNombre: string
  porcionG: number | null
}

export type ErroresAporte = Partial<Record<keyof DatosAporte, string>>

const enRango = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max

/** Revisa que lo copiado de la etiqueta tenga sentido. Devuelve {} si está todo bien. */
export function validarAporte(d: DatosAporte): ErroresAporte {
  const e: ErroresAporte = {}
  const nombre = d.nombre.trim()
  if (nombre.length < 2) e.nombre = 'Escribe el nombre del producto.'
  else if (nombre.length > 80) e.nombre = 'Máximo 80 caracteres.'
  if (d.marca.trim().length > 40) e.marca = 'Máximo 40 caracteres.'
  if (d.codigo && !codigoValido(d.codigo)) e.codigo = 'Revisa el código: deben ser los números bajo las barras.'
  if (!enRango(d.kcal, 0, 900)) e.kcal = 'Entre 0 y 900 kcal por 100 g.'
  if (!enRango(d.proteina, 0, 100)) e.proteina = 'Entre 0 y 100 g.'
  if (!enRango(d.carbos, 0, 100)) e.carbos = 'Entre 0 y 100 g.'
  if (!enRango(d.grasas, 0, 100)) e.grasas = 'Entre 0 y 100 g.'
  if (!e.proteina && !e.carbos && !e.grasas && d.proteina + d.carbos + d.grasas > 100.5) {
    e.grasas = 'Proteína, carbohidratos y grasas no pueden sumar más de 100 g en 100 g.'
  }
  if (!e.kcal && !e.proteina && !e.carbos && !e.grasas) {
    const calculadas = d.proteina * 4 + d.carbos * 4 + d.grasas * 9
    const diferencia = Math.abs(calculadas - d.kcal)
    if (diferencia > 20 && diferencia / Math.max(d.kcal, 1) > 0.15) {
      e.kcal = `Las calorías no cuadran con los macros (darían unas ${Math.round(calculadas)} kcal). Revisa que todo sea de la columna "100 g".`
    }
  }
  if (d.porcionG !== null && !enRango(d.porcionG, 1, 1000)) e.porcionG = 'Entre 1 y 1000 g.'
  if (d.porcionNombre.trim().length > 30) e.porcionNombre = 'Máximo 30 caracteres.'
  return e
}

export type EstadoComunidad = 'nuevo' | 'verificado' | 'oculto'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "Verificado por 3 personas" o "Sin verificar · 1 confirmación". */
export function estadoAporte(a: { estado: EstadoComunidad; confirmaciones: number; reportes: number }): { verificado: boolean; texto: string } {
  if (a.estado === 'verificado') return { verificado: true, texto: `Verificado por ${plural(a.confirmaciones, 'persona', 'personas')}` }
  if (a.reportes > 0) return { verificado: false, texto: `Sin verificar · ${plural(a.reportes, 'reporte de error', 'reportes de error')}` }
  if (a.confirmaciones > 0) return { verificado: false, texto: `Sin verificar · ${plural(a.confirmaciones, 'confirmación', 'confirmaciones')}` }
  return { verificado: false, texto: 'Sin verificar · aún nadie lo confirma' }
}
