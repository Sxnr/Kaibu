import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// La CSP solo permite el script en línea de index.html por su hash: si alguien lo edita,
// esta prueba avisa que hay que actualizar el hash en vercel.json y vite.config.ts.
describe('Content-Security-Policy', () => {
  const html = readFileSync('index.html', 'utf8')
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { headers: { key: string; value: string }[] }[] }
  const csp = vercel.headers[0]!.headers.find((h) => h.key === 'Content-Security-Policy')!.value

  it('autoriza exactamente los scripts en línea de index.html', () => {
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!)
    expect(scripts.length).toBeGreaterThan(0)
    for (const s of scripts) {
      const hash = `'sha256-${createHash('sha256').update(s).digest('base64')}'`
      expect(csp).toContain(hash)
    }
  })

  it('la CSP de pruebas locales es la misma que la de producción', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toContain(csp)
  })

  it('no permite eval ni scripts en línea sin hash', () => {
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })
})
