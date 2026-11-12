import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

test.describe('Descarga de la app y "Ya tengo cuenta"', () => {
  test('bienvenida: "Ya tengo cuenta" lleva a iniciar sesión', async ({ page }, info) => {
    await page.goto('/bienvenida')
    const boton = page.getByRole('button', {
      name: 'Ya tengo cuenta: iniciar sesión',
    })
    await expect(boton).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Bienvenida con "Ya tengo cuenta"')
    await captura(page, info, '01-bienvenida-ya-tengo-cuenta')
    await boton.click()
    await expect(page).toHaveURL(/\/entrar$/)
    await captura(page, info, '02-iniciar-sesion')
  })

  test.describe('web en Android', () => {
    test.use({ userAgent: ANDROID })

    test('Hoy ofrece descargar la app y "Ahora no" lo esconde', async ({ page }, info) => {
      await completarInicio(page)
      await page.getByRole('button', { name: 'Empezar' }).click()
      const aviso = page.getByRole('region', {
        name: 'Descarga la app de Kaibu',
      })
      await expect(aviso).toBeVisible()
      await expect(aviso.getByRole('link', { name: 'Descargar' })).toHaveAttribute('href', '/descargar/android')
      await sinScrollHorizontal(page)
      await revisarAccesibilidad(page, 'Hoy con aviso de descarga')
      await captura(page, info, '03-hoy-aviso-descarga')

      await aviso.getByRole('button', { name: 'Ahora no' }).click()
      await expect(aviso).toBeHidden()
      await page.reload()
      await expect(page.getByText('Kcal restantes')).toBeVisible()
      await expect(page.getByRole('region', { name: 'Descarga la app de Kaibu' })).toBeHidden()
      await captura(page, info, '04-hoy-sin-aviso')
    })
  })

  test('fuera de Android Hoy no muestra el aviso', async ({ page }) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Descarga la app de Kaibu' })).toBeHidden()
  })
})
