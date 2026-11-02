import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Cada función nueva se captura sin datos (por defecto) y después de usarla.
test.describe('Kaibu · Etapa 2 · Sprint 2 (modo local)', () => {
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

  test('agua, nota del día y tamaño del vaso', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto('/')
    const agua = page.getByRole('progressbar', { name: 'Agua del día' })
    const nota = page.getByLabel('Nota del día')
    await expect(page.getByText('Aún no anotas agua hoy.')).toBeVisible()
    await expect(nota).toHaveValue('')
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con agua y nota vacías')
    await nota.scrollIntoViewIfNeeded()
    await captura(page, info, '20-agua-nota-vacio')

    // + 3 vasos, − 1 vaso y deshacer: queda en 750 ml.
    const masUno = page.getByRole('button', { name: /1 vaso \(250 ml\)/ })
    for (let i = 0; i < 3; i++) await masUno.click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    await page.getByRole('button', { name: 'Quitar un vaso de 250 ml' }).click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^500 de /)
    await page.getByRole('button', { name: 'Deshacer' }).click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    // Al cerrarse, el aviso devuelve el foco al botón tocado: se espera a que termine antes de escribir.
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)

    // La nota se guarda al salir del cuadro y sigue ahí al recargar.
    await nota.fill('Entrené piernas y dormí 7 horas.')
    await page.getByRole('heading', { name: 'Comidas' }).click()
    await expect(page.getByText('Nota guardada')).toBeVisible()
    await page.reload()
    await expect(nota).toHaveValue('Entrené piernas y dormí 7 horas.')
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    await expect(page.getByText(/Te faltan .* ml\./)).toBeVisible()
    await nota.scrollIntoViewIfNeeded()
    await captura(page, info, '21-agua-nota-usado')

    // Tamaño del vaso en Ajustes: parte en 250 ml y acepta solo 100 a 1.000 ml.
    await page.getByRole('link', { name: 'Vaso de 250 ml' }).click()
    await expect(page).toHaveURL(/\/ajustes#vaso$/)
    await expect(page.getByRole('radio', { name: '250 ml' })).toBeChecked()
    // La captura de página completa se toma desde arriba (si no, la barra fija queda a media imagen).
    await page.evaluate(() => window.scrollTo(0, 0))
    await captura(page, info, '22-vaso-por-defecto')
    const otro = page.getByLabel('Otro tamaño (ml)')
    await otro.fill('50')
    await otro.press('Enter')
    await expect(page.getByRole('alert')).toContainText('entre 100 y 1.000 ml')
    await otro.fill('')
    await page.getByRole('radio', { name: '500 ml' }).click()
    await expect(page.getByRole('radio', { name: '500 ml' })).toBeChecked()
    await revisarAccesibilidad(page, 'Ajustes con el tamaño del vaso')
    await page.evaluate(() => window.scrollTo(0, 0))
    await captura(page, info, '23-vaso-cambiado')
    await page.goto('/')
    await expect(page.getByRole('button', { name: /1 vaso \(500 ml\)/ })).toBeVisible()
  })
})
