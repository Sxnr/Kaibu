import { describe, expect, it } from 'vitest'
import { LIMITE_DIARIO, debeInformarRacha, describirPlataforma, enviosUltimas24h, textoEstado } from './reportes'

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0',
  macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:131.0) Gecko/20100101 Firefox/131.0',
}

describe('plataforma del reporte', () => {
  it('describe dónde se usa Kaibu sin datos personales', () => {
    expect(describirPlataforma({ userAgent: UA.androidChrome, instalada: false, apk: true })).toBe('APK · Android · Chrome')
    expect(describirPlataforma({ userAgent: UA.iphoneSafari, instalada: true, apk: false })).toBe('App instalada · iPhone · Safari')
    expect(describirPlataforma({ userAgent: UA.windowsEdge, instalada: false, apk: false })).toBe('Web · Windows · Edge')
    expect(describirPlataforma({ userAgent: UA.macFirefox, instalada: false, apk: false })).toBe('Web · Mac · Firefox')
    expect(describirPlataforma({ userAgent: '', instalada: false, apk: false })).toBe('Web · Otro sistema · Otro navegador')
  })
})

describe('límite de envíos', () => {
  const ahora = new Date('2026-11-05T15:00:00Z')
  const fila = (createdAt: string, deletedAt: string | null = null) => ({ createdAt, deletedAt })

  it('cuenta solo lo enviado en las últimas 24 horas y no borrado', () => {
    const filas = [fila('2026-11-05T10:00:00Z'), fila('2026-11-04T16:00:00Z'), fila('2026-11-04T14:00:00Z'), fila('2026-11-05T11:00:00Z', '2026-11-05T11:00:05Z')]
    expect(enviosUltimas24h(filas, ahora)).toBe(2)
    expect(LIMITE_DIARIO).toBe(10)
  })
})

describe('estado de un envío', () => {
  it('tiene un texto claro para cada estado', () => {
    expect(textoEstado('enviado', true)).toBe('Esperando conexión')
    expect(textoEstado('enviado', false)).toBe('Enviado')
    expect(textoEstado('publicado', false)).toBe('Publicado en Discord')
    expect(textoEstado('en_sprint', false)).toBe('En arreglo')
    expect(textoEstado('resuelto', false)).toBe('Resuelto')
    expect(textoEstado('fuera_alcance', false)).toBe('Fuera de alcance por ahora')
  })
})

describe('racha para Discord', () => {
  it('se informa una vez por día o cuando cambia', () => {
    expect(debeInformarRacha(null, '2026-11-05', 3)).toBe(true)
    expect(debeInformarRacha('2026-11-05:3', '2026-11-05', 3)).toBe(false)
    expect(debeInformarRacha('2026-11-05:3', '2026-11-05', 4)).toBe(true)
    expect(debeInformarRacha('2026-11-04:3', '2026-11-05', 3)).toBe(true)
  })
})
