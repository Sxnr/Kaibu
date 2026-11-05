import { describe, expect, it } from 'vitest'
import { aCsv, armarExportacion, archivosCsv } from './exportar'

describe('CSV para Excel en Chile (RF-45)', () => {
  it('usa punto y coma, coma decimal y comillas cuando hace falta', () => {
    const csv = aCsv([
      { fecha: '2026-11-02', nombre: 'Pan; con palta', kg: 91.1, nota: 'dijo "hola"' },
      { fecha: '2026-11-03', nombre: 'Huevo', kg: 90, nota: null },
    ])
    expect(csv).toBe(
      '﻿fecha;nombre;kg;nota\r\n2026-11-02;"Pan; con palta";91,1;"dijo ""hola"""\r\n2026-11-03;Huevo;90;\r\n',
    )
  })

  it('convierte listas y objetos a texto', () => {
    expect(aCsv([{ comidas: ['desayuno', 'once'] }])).toBe('﻿comidas\r\n"[""desayuno"",""once""]"\r\n')
  })

  it('una tabla vacía queda sin filas', () => {
    expect(aCsv([])).toBe('﻿')
  })
})

describe('exportación completa', () => {
  const borrado = { deletedAt: '2026-11-01T00:00:00Z' }
  const vivo = { deletedAt: null }
  const datos = {
    perfil: { userId: 'u1', nombre: 'Ana', ...vivo },
    registros: [{ id: 'r1', kcal: 300, ...vivo }, { id: 'r2', kcal: 100, ...borrado }],
    pesos: [{ fecha: '2026-11-01', kg: 70.5, ...vivo }],
    dias: [{ fecha: '2026-11-01', aguaMl: 1500, nota: 'Bien', ...vivo }],
    consentimientos: [{ tipo: 'terminos', version: '2026-10-25', ...vivo }],
    eventos: [],
    misAlimentos: [],
    favoritos: [],
    reportes: [{ id: 'f1', tipo: 'bug', descripcion: 'Se cerró al guardar', ...vivo }],
  }

  it('incluye todo lo del usuario menos lo borrado', () => {
    const e = armarExportacion(datos, '2026-11-02T10:00:00Z')
    expect(e.app).toBe('Kaibu')
    expect(e.exportadoEn).toBe('2026-11-02T10:00:00Z')
    expect(e.datos.registros).toHaveLength(1)
    expect(e.datos.perfil).toMatchObject({ nombre: 'Ana' })
    expect(Object.keys(e.datos)).toEqual(['perfil', 'registros', 'pesos', 'dias', 'consentimientos', 'eventos', 'misAlimentos', 'favoritos', 'reportes'])
  })

  it('arma un CSV por tabla, sin la columna de borrado', () => {
    const archivos = archivosCsv(armarExportacion(datos, '2026-11-02T10:00:00Z'))
    expect(Object.keys(archivos)).toContain('registros.csv')
    expect(archivos['perfil.csv']).toContain('Ana')
    expect(archivos['pesos.csv']).toBe('﻿fecha;kg\r\n2026-11-01;70,5\r\n')
  })
})
