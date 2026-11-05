import { expect, test } from '@playwright/test'
import { captura, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Web compilada como beta cerrada (segundo servidor de playwright.config.ts, puerto 4174).
test.use({ baseURL: 'http://localhost:4174' })

test.describe('Kaibu · beta cerrada', () => {
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

  test('landing sin "Iniciar sesión" ni "Empezar gratis": lista de espera, comunidad y código de beta', async ({ page }, info) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /no debería ser una condena/ })).toBeVisible()
    await expect(page.getByText('🧪 Beta privada · cupos limitados')).toBeVisible()
    await expect(page.getByRole('link', { name: /Únete a la lista de espera/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Únete a la comunidad' })).toHaveAttribute('href', 'https://discord.gg/kaibu-prueba')
    await expect(page.getByRole('link', { name: /Empezar gratis/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveCount(0)
    await sinScrollHorizontal(page)
    await captura(page, info, '51-landing-beta-cerrada', true)
  })

  test('crear cuenta exige un código de beta válido', async ({ page }, info) => {
    // Ir directo a registrarse lleva a la página del código.
    await page.goto('/registro')
    await expect(page).toHaveURL(/\/beta$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Beta privada' })).toBeVisible()
    await revisarAccesibilidad(page, 'Página del código de beta')
    await captura(page, info, '52-codigo-beta-por-defecto')

    // Un código con formato inválido muestra un error claro.
    const campo = page.getByLabel('Código de beta')
    await campo.fill('abc')
    await page.getByRole('button', { name: /Continuar y crear mi cuenta/ }).click()
    await expect(page.getByRole('alert')).toContainText('8 letras o números')
    await captura(page, info, '53-codigo-beta-con-error')

    // Con el link del bot (?codigo=) el código viene listo y deja crear la cuenta.
    await page.goto('/beta?codigo=k7m2qx4p')
    await expect(page.getByLabel('Código de beta')).toHaveValue('k7m2qx4p')
    await page.getByRole('button', { name: /Continuar y crear mi cuenta/ }).click()
    await expect(page).toHaveURL(/\/bienvenida$/)
    await page.getByRole('button', { name: 'Saltar' }).click()
    await expect(page).toHaveURL(/\/registro$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeVisible()
    await captura(page, info, '54-registro-con-codigo')
  })
})
