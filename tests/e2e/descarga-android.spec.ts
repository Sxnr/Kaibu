import { expect, test } from '@playwright/test'
import { captura, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// "Descargar para Android" en la landing: visible para todos (beta abierta y cerrada), con aviso de código.
test.describe('Kaibu · descarga de la app para Android', () => {
  test('la portada y el pie ofrecen el APK con el aviso de beta', async ({ page }, info) => {
    await page.goto('/')
    const boton = page.getByRole('link', { name: 'Descargar para Android' }).first()
    await expect(boton).toBeVisible()
    await expect(boton).toHaveAttribute('href', '/descargar/android')
    await expect(page.getByText(/para crear tu cuenta necesitas tu código/)).toBeVisible()
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Descargar para Android' })).toHaveAttribute('href', '/descargar/android')
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Landing con descarga de Android')
    await captura(page, info, '71-descarga-android', true)
  })

  test('con la beta cerrada también se ofrece la descarga', async ({ page }) => {
    await page.goto('http://localhost:4174/')
    await expect(page.getByText('🧪 Beta privada · cupos limitados')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Descargar para Android' }).first()).toHaveAttribute('href', '/descargar/android')
  })

  test('en iPhone explica cómo agregar Kaibu a la pantalla de inicio', async ({ browser }, info) => {
    const contexto = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
    })
    const page = await contexto.newPage()
    await page.goto(`${info.project.use.baseURL ?? 'http://localhost:4173'}/`)
    await expect(page.getByText(/Agregar a pantalla de inicio/)).toBeVisible()
    await contexto.close()
  })
})
