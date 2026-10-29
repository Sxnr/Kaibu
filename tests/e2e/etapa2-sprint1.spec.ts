import { expect, test, type Page } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Domingo: día de revisión del ajuste semanal.
const DOMINGO = new Date('2026-11-01T12:00:00-03:00')

/** Carga 3 semanas de pesos estancados en 70,5 kg directo en la base del dispositivo (modo local). */
async function cargarPesosEstancados(page: Page) {
  await page.evaluate(async () => {
    const abrir = indexedDB.open('kaibu')
    const db: IDBDatabase = await new Promise((ok, mal) => {
      abrir.onsuccess = () => ok(abrir.result)
      abrir.onerror = () => mal(abrir.error)
    })
    const tx = db.transaction('pesos', 'readwrite')
    const tabla = tx.objectStore('pesos')
    for (let d = 12; d <= 32; d++) {
      const fecha = d <= 31 ? `2026-10-${String(d).padStart(2, '0')}` : '2026-11-01'
      tabla.put({ userId: 'local', fecha, kg: 70.5, updatedAt: new Date().toISOString(), deletedAt: null })
    }
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
}

test.describe('Kaibu · Etapa 2 · Sprint 1 (modo local)', () => {
  let errores: string[] = []
  test.beforeEach(async ({ page }) => {
    errores = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(m.text())) errores.push(m.text())
    })
    page.on('pageerror', (e) => errores.push(e.message))
    await page.clock.setFixedTime(DOMINGO)
  })
  test.afterEach(() => {
    expect(errores, 'Errores en la consola del navegador').toEqual([])
  })

  test('landing: la lista de espera explica que se activa al publicar (modo local)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Te avisamos cuando lleguemos a tu celular.' })).toBeVisible()
    await expect(page.getByText('La lista de espera se activa cuando Kaibu esté publicado')).toBeVisible()
    await page.goto('/baja?token=no-valido')
    await expect(page.getByText('El enlace no es válido')).toBeVisible()
    await revisarAccesibilidad(page, 'Baja de la lista de espera')
  })

  test('ajuste semanal: aparece el domingo, se acepta y se deshace', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await cargarPesosEstancados(page)
    await page.reload()

    const tarjeta = page.getByRole('region', { name: /Te sugerimos/ })
    await expect(tarjeta).toBeVisible()
    await expect(tarjeta).toContainText('−150 kcal')
    await expect(tarjeta).toContainText('menos de la mitad de lo planeado')
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con ajuste semanal')
    await captura(page, info, '11-ajuste-semanal')

    await tarjeta.getByRole('button', { name: 'Aceptar desde mañana' }).click()
    await expect(page.getByText(/Desde mañana tu meta será/)).toBeVisible()
    await expect(tarjeta).toBeHidden()
    await page.getByRole('button', { name: 'Deshacer' }).click()
    await expect(page.getByRole('region', { name: /Te sugerimos/ })).toBeVisible()

    await page.getByRole('button', { name: 'Ahora no' }).click()
    await expect(page.getByText('Mantienes tu meta actual')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await expect(page.getByRole('region', { name: /Te sugerimos/ })).toBeHidden()
  })

  test('terminar el día y gráfico de peso', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await cargarPesosEstancados(page)
    await page.reload()

    await page.getByRole('link', { name: 'Agregar a Desayuno' }).click()
    await page.getByLabel('Buscar alimento').fill('marraqueta')
    await page.getByRole('button', { name: /^Marraqueta/ }).click()
    await page.getByRole('button', { name: 'Agregar a Desayuno' }).click()
    await page.goto('/')

    await page.getByRole('button', { name: 'Terminar día' }).click()
    await expect(page.getByText('Día terminado fuera de tu rango')).toBeVisible()
    await expect(page.getByText(/Día terminado con \d+ kcal/)).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Terminar día' })).toBeHidden()

    await page.goto('/progreso')
    await expect(page.getByRole('heading', { name: 'Tu peso' })).toBeVisible()
    const grafico = page.getByRole('img', { name: /registros\. El promedio de 7 días/ })
    await expect(grafico).toBeVisible()
    await page.getByRole('button', { name: '2 semanas' }).click()
    await expect(page.getByRole('button', { name: '2 semanas' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('img', { name: /14 registros/ })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Progreso con gráfico')
    await captura(page, info, '12-progreso-grafico')
  })
})
