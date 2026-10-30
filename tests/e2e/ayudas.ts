import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, type TestInfo } from '@playwright/test'

/** Revisión automática de accesibilidad (WCAG 2.2 AA) con axe. */
export async function revisarAccesibilidad(page: Page, nombre: string) {
  // Espera a que terminen las animaciones de entrada para medir colores reales.
  await page.waitForTimeout(800)
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const problemas = resultado.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(problemas, `Problemas de accesibilidad en ${nombre}`).toEqual([])
}

/** Nada se corta ni genera scroll horizontal. */
export async function sinScrollHorizontal(page: Page) {
  await page.waitForTimeout(600) // fin de las animaciones de entrada
  const ancho = await page.evaluate(() => ({ total: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }))
  expect(ancho.total).toBeLessThanOrEqual(ancho.visible)
}

export async function captura(page: Page, info: TestInfo, nombre: string) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: info.outputPath(`${nombre}.png`), fullPage: true })
}

/** Recorre bienvenida → registro local → cuestionario → Tu plan. */
export async function completarInicio(page: Page, info?: TestInfo) {
  await page.goto('/')
  // La web abre en la landing; "Empezar gratis" lleva a la bienvenida la primera vez.
  await expect(page.getByRole('heading', { level: 1, name: /no debería ser una condena/ })).toBeVisible()
  await page.getByRole('link', { name: /Empezar gratis/ }).click()
  await expect(page).toHaveURL(/\/bienvenida$/)
  if (info) await captura(page, info, '01b-bienvenida')
  await page.getByRole('button', { name: 'Saltar' }).click()
  await expect(page).toHaveURL(/\/registro$/)
  await page.getByLabel('Acepto los Términos y Condiciones').check()
  await page.getByLabel(/Doy mi consentimiento/).check()
  await page.getByRole('button', { name: 'Usar en este dispositivo' }).click()

  await expect(page).toHaveURL(/\/configuracion$/)
  const continuar = page.getByRole('button', { name: 'Continuar' })
  await page.getByLabel('Nombre').fill('Ana')
  await continuar.click()
  await page.getByRole('radio', { name: 'Mujer' }).click()
  await continuar.click()
  await page.getByLabel('Fecha de nacimiento').fill('1995-04-10')
  await continuar.click()
  await page.getByLabel('Estatura (cm)').fill('165')
  await continuar.click()
  await page.getByLabel('Peso actual (kg)').fill('70,5')
  await continuar.click()
  if (info) await captura(page, info, '02b-cuestionario')
  await page.getByRole('radio', { name: /Mayormente sentado/ }).click()
  await continuar.click()
  await page.getByRole('radio', { name: '3', exact: true }).click()
  await continuar.click()
  await page.getByRole('radio', { name: /Perder grasa/ }).click()
  await continuar.click()
  await page.getByLabel('Peso meta (kg)').fill('64')
  await continuar.click()
  await expect(page.getByRole('radio', { name: /Recomendada/ })).toBeChecked()
  await continuar.click()
  await page.getByRole('radio', { name: /4 comidas/ }).click()
  await page.getByRole('button', { name: 'Ver mi plan' }).click()
  await expect(page).toHaveURL(/\/tu-plan$/)
}
