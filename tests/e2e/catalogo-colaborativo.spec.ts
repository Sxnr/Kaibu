import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Catálogo completo: buscador tolerante, escáner de códigos (catálogo → comunidad → Open Food Facts) y aportes.
const OFF = 'https://world.openfoodfacts.org/api/v2/product/**'

test.describe('Kaibu · catálogo colaborativo y escáner', () => {
  test('encuentra con errores de tipeo y sinónimos', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto(`/agregar?q=${encodeURIComponent('espagueti 5')}`)
    await expect(page.getByRole('button', { name: /^Spaghetti 5/ }).first()).toBeVisible()
    await page.goto('/agregar?q=luchetti')
    await expect(page.getByRole('heading', { name: 'Productos con marca' })).toBeVisible()
    await expect(page.getByText('Lucchetti').first()).toBeVisible()
    await sinScrollHorizontal(page)
    await captura(page, info, '72-buscar-con-errores')
  })

  test('escanear: catálogo, Open Food Facts y aportar lo que falta', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto('/agregar')
    await captura(page, info, '73-agregar-con-escanear', true)

    // Código de un producto del catálogo de Kaibu (Spaghetti 5 Carozzi).
    await page.getByRole('button', { name: 'Escanear' }).click()
    await expect(page.getByRole('dialog', { name: 'Escanear código' })).toBeVisible()
    await revisarAccesibilidad(page, 'Escáner de códigos')
    await captura(page, info, '74-escaner')
    await page.getByLabel('O escribe el código').fill('7802575004437')
    await page.getByRole('button', { name: 'Buscar código' }).click()
    await expect(page.getByRole('dialog', { name: 'Spaghetti 5' })).toBeVisible()
    await page.keyboard.press('Escape')

    // Un código que no está en Kaibu pero sí en Open Food Facts.
    await page.route(OFF, (r) =>
      r.fulfill({
        json: {
          status: 1,
          product: { code: '8000000000002', product_name: 'Galletas de avena', brands: 'Marca Importada', serving_quantity: 30, nutriments: { 'energy-kcal_100g': 450, proteins_100g: 7, carbohydrates_100g: 66, fat_100g: 17 } },
        },
      }),
    )
    await page.getByRole('button', { name: 'Escanear' }).click()
    await page.getByLabel('O escribe el código').fill('8000000000002')
    await page.getByRole('button', { name: 'Buscar código' }).click()
    await expect(page.getByRole('dialog', { name: 'Galletas de avena' })).toBeVisible()
    await expect(page.getByText('Lo encontramos en Open Food Facts')).toBeVisible()
    await page.keyboard.press('Escape')

    // Un código que no está en ninguna parte: se aporta para todos.
    await page.unroute(OFF)
    await page.route(OFF, (r) => r.fulfill({ json: { status: 0 } }))
    await page.getByRole('button', { name: 'Escanear' }).click()
    await page.getByLabel('O escribe el código').fill('7809999999905')
    await page.getByRole('button', { name: 'Buscar código' }).click()
    await expect(page).toHaveURL(/\/aportar\?/)
    await expect(page.getByLabel('Código de barras (opcional)')).toHaveValue('7809999999905')
    await revisarAccesibilidad(page, 'Aportar producto')
    await captura(page, info, '75-aportar-vacio')

    // Datos que no cuadran: avisa antes de guardar.
    await page.getByLabel('Nombre del producto').fill('Spaghetti 5')
    await page.getByLabel('Marca (opcional)').fill('Lucchetti')
    await page.getByLabel('Energía (kcal)').fill('80')
    await page.getByLabel('Proteínas (g)').fill('12')
    await page.getByLabel('Hidratos de carbono (g)').fill('72')
    await page.getByLabel('Grasas totales (g)').fill('1,5')
    await page.getByRole('button', { name: 'Aportar a la comunidad' }).click()
    await expect(page.getByText(/no cuadran con los macros/)).toBeVisible()
    await page.getByLabel('Energía (kcal)').fill('350')
    await page.getByLabel('Gramos').fill('80')
    await captura(page, info, '76-aportar-lleno')
    await page.getByRole('button', { name: 'Aportar a la comunidad' }).click()

    // Queda en la búsqueda, en "Comunidad", y la ficha dice que es mío.
    await expect(page.getByText(/ya está disponible para todos/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comunidad' })).toBeVisible()
    await captura(page, info, '77-aporte-en-busqueda')
    await page.getByRole('heading', { name: 'Comunidad' }).locator('..').getByRole('button', { name: /^Spaghetti 5/ }).click()
    await expect(page.getByText('Lo aportaste tú. Gracias por ayudar a completar el catálogo.')).toBeVisible()
    await revisarAccesibilidad(page, 'Ficha de un aporte de la comunidad')
    await captura(page, info, '78-ficha-aporte')
  })
})
