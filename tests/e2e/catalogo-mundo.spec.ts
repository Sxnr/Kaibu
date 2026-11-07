import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Catálogo ampliado: comida de otros países, cadenas de comida rápida y lácteos con proteína.
test.describe('Kaibu · catálogo del mundo y cadenas', () => {
  test('busca harina pan, big mac y goodness protein y muestra la fuente', async ({ page }, info) => {
    await completarInicio(page)

    // Sin buscar: Agregar como aparece por defecto.
    await page.goto('/agregar')
    await expect(page.getByLabel('Buscar alimento')).toBeVisible()
    await captura(page, info, '61-agregar-sin-buscar', true)

    // Comida de afuera: va en "Catálogo", no en marcas.
    await page.goto(`/agregar?q=${encodeURIComponent('harina pan')}`)
    await expect(page.getByRole('button', { name: /^Harina de maíz precocida/ }).first()).toBeVisible()
    await page.goto('/agregar?q=arepa')
    await expect(page.getByRole('button', { name: /^Arepa/ }).first()).toBeVisible()
    await sinScrollHorizontal(page)
    await captura(page, info, '62-buscar-arepa')

    // Cadenas: con su marca y el aviso de receta de EE. UU.
    await page.goto(`/agregar?q=${encodeURIComponent('big mac')}`)
    await expect(page.getByRole('heading', { name: 'Productos con marca' })).toBeVisible()
    await captura(page, info, '63-buscar-big-mac')
    await page.getByRole('button', { name: /^Big Mac/ }).first().click()
    await expect(page.getByText(/receta de EE\. UU\., en Chile puede variar/)).toBeVisible()
    await revisarAccesibilidad(page, 'Ficha de un producto de cadena')
    await captura(page, info, '64-ficha-big-mac')

    // Lácteos con proteína que antes había que crear a mano.
    await page.goto(`/agregar?q=${encodeURIComponent('goodness protein')}`)
    await expect(page.getByRole('button', { name: /goodnes protein/i }).first()).toBeVisible()
    await captura(page, info, '65-buscar-goodness-protein')
  })
})
