import { describe, expect, it } from 'vitest'
import { codigoValido, estadoAporte, limpiarCodigo, validarAporte } from './comunidad'

describe('códigos de barras', () => {
  it('deja solo los números', () => {
    expect(limpiarCodigo(' 7802500-222189 ')).toBe('7802500222189')
  })
  it('acepta EAN-13, EAN-8 y UPC-A con su dígito verificador', () => {
    expect(codigoValido('7802500222189')).toBe(true)
    expect(codigoValido('96385074')).toBe(true)
    expect(codigoValido('036000291452')).toBe(true)
  })
  it('rechaza dígito verificador malo o largo raro', () => {
    expect(codigoValido('7802500222188')).toBe(false)
    expect(codigoValido('12345')).toBe(false)
    expect(codigoValido('')).toBe(false)
  })
})

describe('validar un aporte', () => {
  const bueno = { codigo: '7802500222189', nombre: 'Spaghetti 5', marca: 'Lucchetti', kcal: 350, proteina: 12, carbos: 72, grasas: 1.5, porcionNombre: '1 porción', porcionG: 80 }

  it('acepta datos coherentes de una etiqueta', () => {
    expect(validarAporte(bueno)).toEqual({})
  })
  it('el código es opcional, pero si viene debe ser válido', () => {
    expect(validarAporte({ ...bueno, codigo: '' })).toEqual({})
    expect(validarAporte({ ...bueno, codigo: '123' }).codigo).toBeDefined()
  })
  it('marca nombre vacío, macros imposibles y calorías que no cuadran', () => {
    expect(validarAporte({ ...bueno, nombre: ' ' }).nombre).toBeDefined()
    expect(validarAporte({ ...bueno, proteina: 60, carbos: 60 }).grasas).toBeDefined()
    expect(validarAporte({ ...bueno, kcal: 80 }).kcal).toMatch(/no cuadran/)
  })
  it('la porción va entre 1 y 1000 g', () => {
    expect(validarAporte({ ...bueno, porcionG: 0 }).porcionG).toBeDefined()
    expect(validarAporte({ ...bueno, porcionG: null }).porcionG).toBeUndefined()
  })
})

describe('estado de un aporte', () => {
  it('explica cuántas personas lo confirmaron', () => {
    expect(estadoAporte({ estado: 'verificado', confirmaciones: 3, reportes: 0 })).toEqual({ verificado: true, texto: 'Verificado por 3 personas' })
    expect(estadoAporte({ estado: 'nuevo', confirmaciones: 1, reportes: 0 })).toEqual({ verificado: false, texto: 'Sin verificar · 1 confirmación' })
    expect(estadoAporte({ estado: 'nuevo', confirmaciones: 0, reportes: 2 })).toEqual({ verificado: false, texto: 'Sin verificar · 2 reportes de error' })
  })
})
