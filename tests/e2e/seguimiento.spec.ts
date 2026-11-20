import { expect, test, type Page } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

/** Foto de prueba de 600×800 px, dibujada por el mismo navegador. */
async function imagenPrueba(page: Page, color: string): Promise<Buffer> {
  const url = await page.evaluate((c) => {
    const lienzo = document.createElement('canvas')
    lienzo.width = 600
    lienzo.height = 800
    const ctx = lienzo.getContext('2d')!
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 600, 800)
    return lienzo.toDataURL('image/png')
  }, color)
  return Buffer.from(url.split(',')[1]!, 'base64')
}

async function subirFoto(page: Page, nombre: string, color: string) {
  await page.getByLabel('Elegir foto de progreso').setInputFiles({ name: nombre, mimeType: 'image/png', buffer: await imagenPrueba(page, color) })
  await expect(page.getByText('Foto guardada: solo tú puedes verla').first()).toBeVisible()
}

test.describe('Kaibu · 0.5.0 Seguimiento (modo local)', () => {
  let errores: string[] = []
  test.beforeEach(async ({ page }) => {
    errores = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(m.text())) errores.push(m.text())
    })
    page.on('pageerror', (e) => errores.push(e.message))
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
  })
  test.afterEach(() => {
    expect(errores, 'Errores en la consola del navegador').toEqual([])
  })

  test('sin datos: suplementos, medidas y fotos, y recordatorios apagados', async ({ page }, info) => {
    await page.goto('/suplementos')
    await expect(page.getByRole('heading', { name: 'Aún no tienes suplementos' })).toBeVisible()
    await revisarAccesibilidad(page, 'Suplementos vacío')
    await captura(page, info, '01-suplementos-vacio')

    await page.goto('/cuerpo')
    await expect(page.getByRole('heading', { name: 'Aún no anotas medidas' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Aún no tienes fotos' })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Medidas y fotos vacío')
    await captura(page, info, '02-cuerpo-vacio')

    await page.goto('/recordatorios')
    await expect(page.getByText('Recordatorios apagados')).toBeVisible()
    await expect(page.getByLabel('Anota tus comidas')).toBeDisabled()
    await revisarAccesibilidad(page, 'Recordatorios')
    await captura(page, info, '03-recordatorios-apagados')
  })

  test('suplementos: agregar, marcar como tomado (suma sus kcal) y verlo en Hoy', async ({ page }, info) => {
    await page.goto('/suplementos')
    await page.getByRole('button', { name: 'Agregar suplemento' }).click()
    const hoja = page.getByRole('dialog', { name: 'Nuevo suplemento' })
    await hoja.getByLabel('Nombre').fill('Whey')
    await hoja.getByLabel('Dosis (opcional)').fill('1 scoop')
    await hoja.getByLabel('Hora (opcional)').fill('18:00')
    await hoja.getByLabel('Kcal por dosis').fill('120')
    await hoja.getByLabel('Proteína (g)').fill('24')
    await hoja.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Whey agregado')).toBeVisible()

    await page.getByLabel(/^Whey/).click()
    await expect(page.getByText('Whey tomado · +120 kcal')).toBeVisible()
    await revisarAccesibilidad(page, 'Suplementos con datos')
    await captura(page, info, '04-suplementos-usado')

    await page.goto('/')
    const tarjeta = page.getByRole('heading', { name: 'Suplementos' }).locator('..').locator('..')
    await expect(tarjeta.getByLabel(/^Whey/)).toBeChecked()
    await expect(page.getByText(/^120$/).first()).toBeVisible()
  })

  test('medidas y fotos: anotar, ver el cambio y comparar antes/ahora', async ({ page }, info) => {
    await page.goto('/cuerpo')
    await page.getByRole('button', { name: 'Anotar medidas' }).click()
    let hoja = page.getByRole('dialog', { name: 'Anotar medidas' })
    await hoja.getByLabel('Fecha').fill('2026-10-01')
    await hoja.getByLabel('Cintura (cm)').fill('86')
    await hoja.getByLabel('Brazo (cm)').fill('500')
    await hoja.getByRole('button', { name: 'Guardar' }).click()
    await expect(hoja.getByText('Entre 10 y 250 cm')).toBeVisible()
    await hoja.getByLabel('Brazo (cm)').fill('34')
    await hoja.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Medidas guardadas').first()).toBeVisible()

    await page.getByRole('button', { name: 'Anotar medidas' }).click()
    hoja = page.getByRole('dialog', { name: 'Anotar medidas' })
    await hoja.getByLabel('Cintura (cm)').fill('82,5')
    await hoja.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('−3,5 cm desde el inicio')).toBeVisible()

    await subirFoto(page, 'antes.png', '#a33')
    await subirFoto(page, 'ahora.png', '#3a3')
    await expect(page.getByRole('button', { name: /^Ver foto del/ })).toHaveCount(2)
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Medidas y fotos con datos')
    await captura(page, info, '05-cuerpo-usado')

    await page.getByRole('button', { name: 'Comparar' }).click()
    await page.getByRole('button', { name: /^Elegir foto del/ }).nth(0).click()
    await page.getByRole('button', { name: /^Elegir foto del/ }).nth(1).click()
    await expect(page.getByRole('dialog', { name: 'Antes y ahora' })).toBeVisible()
    await captura(page, info, '06-antes-y-ahora', true)
  })

  test('recordatorios: activar con permiso y elegir qué avisos', async ({ page, context }, info) => {
    await context.grantPermissions(['notifications'])
    await page.goto('/recordatorios')
    await page.getByLabel(/Recordatorios apagados/).click()
    await expect(page.getByText('Recordatorios activados').first()).toBeVisible()
    await expect(page.getByLabel('Anota tus comidas')).toBeEnabled()
    await page.getByLabel('Agua').click()
    await expect(page.getByLabel('Agua')).not.toBeChecked()
    await page.reload()
    await expect(page.getByLabel('Agua')).not.toBeChecked()
    await expect(page.getByLabel(/Recordatorios activados/)).toBeChecked()
    await revisarAccesibilidad(page, 'Recordatorios activados')
    await captura(page, info, '07-recordatorios-activados')

    // Apoya el proyecto: enlace a Ko-fi en Ajustes.
    await page.goto('/ajustes')
    await expect(page.getByRole('link', { name: /Apoyar en Ko-fi/ })).toHaveAttribute('href', 'https://ko-fi.com/fckaibu')
  })
})
