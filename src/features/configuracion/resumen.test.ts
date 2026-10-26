import { describe, expect, it } from 'vitest'
import { resumenRespuesta } from './resumen'

describe('resumenRespuesta', () => {
  it('resume cada respuesta en formato chileno', () => {
    expect(resumenRespuesta('nombre', { nombre: ' Ana ' })).toBe('Ana')
    expect(resumenRespuesta('peso', { pesoKg: '70,5' })).toBe('70,5 kg')
    expect(resumenRespuesta('estatura', { estaturaCm: '165' })).toBe('165 cm')
    expect(resumenRespuesta('entrenamiento', { diasEntrenamiento: '1' })).toBe('1 día por semana')
    expect(resumenRespuesta('comidas', { numComidas: '4', colaciones: true })).toBe('4 comidas + colaciones')
    expect(resumenRespuesta('objetivo', { objetivo: 'perder' })).toBe('Perder grasa')
  })
  it('null si falta la respuesta o no es válida', () => {
    expect(resumenRespuesta('nombre', { nombre: '  ' })).toBeNull()
    expect(resumenRespuesta('peso', { pesoKg: 'abc' })).toBeNull()
    expect(resumenRespuesta('nacimiento', { fechaNacimiento: '' })).toBeNull()
  })
})
