import { expect, test, type Page } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

/** Simula envíos ya publicados por el bot (en modo local no hay servidor que los cambie). */
async function cargarEnvios(page: Page) {
  await page.evaluate(async () => {
    const abrir = indexedDB.open('kaibu')
    const db: IDBDatabase = await new Promise((ok, mal) => {
      abrir.onsuccess = () => ok(abrir.result)
      abrir.onerror = () => mal(abrir.error)
    })
    const tx = db.transaction('reportes', 'readwrite')
    const tabla = tx.objectStore('reportes')
    const base = { userId: 'local', plataforma: 'Web · Windows · Chrome', versionApp: '0.2.0-beta', sinConexion: false, deletedAt: null }
    tabla.put({ ...base, id: crypto.randomUUID(), tipo: 'bug', titulo: 'No se guarda el agua', descripcion: 'Toco + 1 vaso y al recargar vuelve a cero.', estado: 'en_sprint', createdAt: '2026-11-04T12:00:00Z', updatedAt: '2026-11-04T12:00:00Z' })
    tabla.put({ ...base, id: crypto.randomUUID(), tipo: 'sugerencia', titulo: 'Metas distintas los días de entreno', descripcion: 'Comer más los días que entreno piernas.', estado: 'aprobada', createdAt: '2026-11-05T09:00:00Z', updatedAt: '2026-11-05T09:00:00Z' })
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
}

test.describe('Kaibu · Comunidad de Discord (modo local)', () => {
  let errores: string[] = []
  test.beforeEach(({ page }) => {
    errores = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(m.text())) errores.push(m.text())
    })
    page.on('pageerror', (e) => errores.push(e.message))
  })
  test.afterEach(() => {
    expect(errores, 'Errores en la consola del navegador').toEqual([])
  })

  test('comunidad: unirse, vincular y enviar reportes o sugerencias', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.goto('/ajustes')
    await page.getByRole('link', { name: /Comunidad.*Discord, reportes y sugerencias/ }).click()
    await expect(page).toHaveURL(/\/comunidad$/)

    // Por defecto: link al Discord, vincular pide cuenta y aún no hay envíos.
    await expect(page.getByRole('heading', { level: 1, name: 'Comunidad' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar al Discord' })).toHaveAttribute('href', 'https://discord.gg/kaibu-prueba')
    await expect(page.getByText('Para vincular tu Discord necesitas una cuenta de Kaibu')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Aún no envías nada' })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Comunidad vacía')
    await captura(page, info, '44-comunidad-por-defecto')

    // Formulario de reporte: valida y avisa que sin cuenta no se puede enviar.
    await page.getByRole('button', { name: 'Reportar un problema' }).click()
    const hoja = page.getByRole('dialog', { name: 'Reportar un problema' })
    await expect(hoja).toBeVisible()
    await expect(hoja.getByText(/Se enviará: Web/)).toBeVisible()
    await hoja.getByLabel('¿Qué pasó y cómo repetirlo?').fill('Al tocar + 1 vaso el agua no se guarda.')
    await hoja.getByLabel('Pasó sin conexión a internet').check()
    await expect(hoja.getByRole('alert')).toContainText('sin cuenta')
    await expect(hoja.getByRole('button', { name: 'Enviar reporte' })).toBeDisabled()
    await revisarAccesibilidad(page, 'Formulario de reporte')
    await captura(page, info, '45-reportar-problema', true)
    await page.keyboard.press('Escape')

    // La sugerencia exige título.
    await page.getByRole('button', { name: 'Enviar una sugerencia' }).click()
    const sug = page.getByRole('dialog', { name: 'Enviar una sugerencia' })
    await expect(sug.getByText('Se publica sin tu nombre')).toBeVisible()
    await page.keyboard.press('Escape')

    // Después de usarla: los envíos con su estado (texto + ícono, no solo color).
    await cargarEnvios(page)
    await page.reload()
    await expect(page.getByText('No se guarda el agua')).toBeVisible()
    await expect(page.getByText('En arreglo')).toBeVisible()
    await expect(page.getByText('Aprobada', { exact: true })).toBeVisible()
    await revisarAccesibilidad(page, 'Comunidad con envíos')
    await captura(page, info, '46-comunidad-con-envios')
  })
})
