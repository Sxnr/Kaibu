import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Viernes 20 de noviembre de 2026: la "próxima semana" va del lunes 23 al domingo 29.
const VIERNES = new Date('2026-11-20T12:00:00-03:00')

test.describe('Kaibu · 0.4.0 Planifica tu semana (modo local)', () => {
  let errores: string[] = []
  test.beforeEach(async ({ page }, info) => {
    errores = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(m.text())) errores.push(m.text())
    })
    page.on('pageerror', (e) => errores.push(e.message))
    // Fecha fija para las semanas. La prueba "sin datos" usa el reloj real: el falso congela la animación al cerrar ventanas.
    if (!info.title.startsWith('sin datos')) {
      await page.clock.install({ time: VIERNES })
      await page.clock.resume()
    }
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
  })
  test.afterEach(() => {
    expect(errores, 'Errores en la consola del navegador').toEqual([])
  })

  test('sin datos: Planificar explica cómo empezar y "¿Cómo se usa?" ayuda', async ({ page }, info) => {
    await page.goto('/planificar')
    await expect(page.getByRole('heading', { name: 'Aún no tienes preparaciones' })).toBeVisible()
    await expect(page.getByText('Esa semana todavía no tiene comidas')).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Planificar vacío')
    await captura(page, info, '01-planificar-vacio')

    await page.getByRole('button', { name: '¿Cómo se usa?' }).click()
    const guia = page.getByRole('dialog', { name: 'Cómo planificar tu semana' })
    await expect(guia).toBeVisible()
    await revisarAccesibilidad(page, 'Guía de Planificar')
    await captura(page, info, '02-como-se-usa', true)
    await guia.getByRole('button', { name: 'Entendido' }).click()
    await expect(guia).toBeHidden()

    await page.goto('/planificar/compras')
    await expect(page.getByRole('heading', { name: 'No hay nada planificado en estos días' })).toBeVisible()
    await revisarAccesibilidad(page, 'Compras vacío')
  })

  test('meal prep: crear, repartir de lunes a viernes, verlo en Hoy y en la lista de compras', async ({ page }, info) => {
    await page.goto('/planificar')
    await expect(page.getByRole('link', { name: 'Nueva preparación' })).toHaveAttribute('href', '/planificar/receta/nueva')
    // Carga directa: con el reloj de la prueba, la animación de cambio de página no avanza.
    await page.goto('/planificar/receta/nueva')
    await page.getByLabel('Nombre').fill('Arroz con pollo de la semana')
    await page.getByLabel('Porciones').fill('5')
    await page.getByLabel('Buscar ingrediente').fill('arroz blanco cocido')
    await page.getByRole('button', { name: /^Arroz blanco cocido/ }).click()
    await page.getByLabel('Gramos de Arroz blanco cocido').fill('1000')
    await page.getByLabel('Buscar ingrediente').fill('pechuga de pollo cocida')
    await page.getByRole('button', { name: /^Pechuga de pollo cocida/ }).click()
    await page.getByLabel('Gramos de Pechuga de pollo cocida (sin piel)').fill('1200')
    // (1000 × 130 + 1200 × 165) / 100 / 5 = 656 kcal por porción
    await expect(page.getByText('656', { exact: true })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Nueva preparación')
    await captura(page, info, '03-nueva-preparacion')
    await page.getByRole('button', { name: 'Guardar preparación' }).click()
    await expect(page.getByText(/lista: 656 kcal por porción/)).toBeVisible()

    await page.getByRole('button', { name: 'Repartir' }).click()
    const hoja = page.getByRole('dialog', { name: /Repartir Arroz con pollo/ })
    await expect(hoja.getByText(/Se planifica: lunes 23, martes 24, miércoles 25, jueves 26, viernes 27/)).toBeVisible()
    await revisarAccesibilidad(page, 'Repartir')
    await hoja.getByRole('button', { name: 'Repartir', exact: true }).click()
    await expect(page.getByText(/planificado en 5 días \(Almuerzo\)/)).toBeVisible()
    await captura(page, info, '04-planificar-usado')

    // Hoy: la semana próxima con los días planificados, y el día con su aviso.
    await page.goto('/?fecha=2026-11-24')
    await expect(page.getByRole('note').getByText('Día planificado.')).toBeVisible()
    await expect(page.getByText('Kcal por planificar')).toBeVisible()
    await expect(page.getByText('Arroz con pollo de la semana').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /martes 24 de noviembre: planificado/ })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy en un día planificado')
    await captura(page, info, '05-hoy-planificado')

    // Lista de compras de la próxima semana: 5 porciones = toda la preparación.
    await page.goto('/planificar/compras')
    await page.getByRole('radio', { name: 'La próxima' }).click()
    await expect(page.getByText('Arroz blanco cocido')).toBeVisible()
    await expect(page.getByText('1 kg', { exact: true })).toBeVisible()
    await expect(page.getByText('1,2 kg', { exact: true })).toBeVisible()
    await page.getByLabel('Arroz blanco cocido').check()
    await page.reload()
    await page.getByRole('radio', { name: 'La próxima' }).click()
    await expect(page.getByLabel('Arroz blanco cocido')).toBeChecked()
    await revisarAccesibilidad(page, 'Lista de compras')
    await captura(page, info, '06-lista-compras')
  })

  test('historial: semana anterior, calendario del mes y repetir semana', async ({ page }, info) => {
    await page.getByRole('button', { name: 'Semana anterior' }).click()
    await expect(page).toHaveURL(/fecha=2026-11-13/)
    await expect(page.getByText('9 – 15 de noviembre')).toBeVisible()
    await page.getByRole('button', { name: 'Abrir calendario' }).click()
    const cal = page.getByRole('dialog', { name: 'Calendario' })
    await expect(cal.getByText('noviembre 2026')).toBeVisible()
    await revisarAccesibilidad(page, 'Calendario')
    await captura(page, info, '07-calendario', true)
    await cal.getByRole('button', { name: /^jueves 26/ }).click()
    await expect(page).toHaveURL(/fecha=2026-11-26/)

    // Agregar en un día futuro queda planificado.
    await page.goto('/agregar?fecha=2026-11-26&comida=desayuno')
    await expect(page.getByRole('heading', { name: 'Planificar' })).toBeVisible()
    await page.getByLabel('Buscar alimento').fill('marraqueta')
    await page.getByRole('button', { name: /^Marraqueta/ }).first().click()
    await page.getByRole('button', { name: /^(Agregar|Planificar) a Desayuno/ }).click()
    await expect(page.getByText(/planificado para Desayuno del jueves 26 de noviembre/)).toBeVisible()

    // Repetir la próxima semana 2 veces más.
    await page.goto('/planificar')
    await page.getByRole('radio', { name: 'La próxima' }).first().click()
    await page.getByRole('radio', { name: '2', exact: true }).click()
    await page.getByRole('button', { name: 'Repetir semana' }).click()
    await expect(page.getByText(/Repetiste 1 comida en 2 semanas más/)).toBeVisible()
    await page.goto('/?fecha=2026-12-10')
    await expect(page.getByRole('button', { name: /^Editar Marraqueta/ })).toBeVisible()
  })
})
