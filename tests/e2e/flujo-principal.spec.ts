import { expect, test } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

test.describe('Kaibu · flujo principal (modo local)', () => {
  // Cualquier error en la consola (incluidas violaciones de la CSP) hace fallar la prueba.
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

  test('landing: accesible, sin scroll horizontal y lleva a la app', async ({ page }, info) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Tu progreso/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tus datos son tuyos.' })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Landing')
    await captura(page, info, '00-landing')
    await page.getByRole('link', { name: 'Ya tengo cuenta' }).click()
    await expect(page).toHaveURL(/\/entrar$/)
    await captura(page, info, '00b-entrar')
  })

  test('bienvenida y registro son accesibles', async ({ page }, info) => {
    await page.goto('/bienvenida')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu progreso, por fases')
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Bienvenida')
    await captura(page, info, '01-bienvenida')

    await page.getByRole('button', { name: 'Saltar' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    // Sin aceptar no se puede continuar: mensaje claro
    await page.getByRole('button', { name: 'Usar en este dispositivo' }).click()
    await expect(page.getByRole('alert')).toContainText('acepta los Términos')
    await revisarAccesibilidad(page, 'Registro')
    await captura(page, info, '02-registro')
  })

  test('cuestionario → Tu plan → Hoy → agregar comida', async ({ page }, info) => {
    await completarInicio(page, info)

    // Tu plan: valores calculados con los datos ingresados (mujer, 31 años, 165 cm, 70,5 kg, ligero, −0,5 kg/sem)
    await expect(page.getByRole('heading', { name: 'Tu plan' })).toBeVisible()
    await expect(page.getByText('Restamos 550 kcal al día')).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Tu plan')
    await captura(page, info, '03-tu-plan')
    await page.getByRole('button', { name: 'Empezar' }).click()

    // Hoy vacío, con estado vacío bonito
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(page.getByText('Tu día está en blanco')).toBeVisible()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy vacío')
    await captura(page, info, '04-hoy-vacio')

    // Agregar una marraqueta al desayuno
    await page.getByRole('link', { name: 'Agregar a Desayuno' }).click()
    await expect(page.getByRole('radio', { name: 'Desayuno' })).toBeChecked()
    await revisarAccesibilidad(page, 'Agregar')
    await captura(page, info, '05-agregar')
    await page.getByLabel('Buscar alimento').fill('marraqueta')
    await page.getByRole('button', { name: /^Marraqueta/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await revisarAccesibilidad(page, 'Ficha de alimento')
    await captura(page, info, '06-ficha')
    await page.getByRole('button', { name: 'Agregar a Desayuno' }).click()
    await expect(page.getByText('Marraqueta agregado a Desayuno')).toBeVisible()

    // Agregar rápido en el almuerzo
    await page.getByRole('radio', { name: 'Almuerzo' }).click()
    await page.getByRole('button', { name: 'Agregar rápido' }).click()
    await page.getByLabel('Kcal').fill('600')
    await page.getByLabel('Proteína (g)').fill('40')
    await page.getByRole('button', { name: 'Agregar a Almuerzo' }).click()
    await expect(page.getByText('600 kcal agregadas a Almuerzo')).toBeVisible()

    // Volver a Hoy: 275 + 600 = 875 consumidas
    await page.getByRole('button', { name: 'Volver a Hoy' }).click()
    await expect(page.getByText('875', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Editar Marraqueta/ })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con registros')
    await captura(page, info, '07-hoy')

    // Editar y borrar con "Deshacer"
    await page.getByRole('button', { name: /Editar Marraqueta/ }).click()
    await page.getByRole('button', { name: 'Borrar' }).click()
    await expect(page.getByRole('button', { name: /Editar Marraqueta/ })).toHaveCount(0)
    await page.getByRole('listitem').filter({ hasText: 'Borraste Marraqueta' }).getByRole('button', { name: 'Deshacer' }).click()
    await expect(page.getByRole('button', { name: /Editar Marraqueta/ })).toBeVisible()

    // Registrar peso desde Hoy
    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    await page.getByLabel('Peso (kg)').fill('70,1')
    await page.getByRole('button', { name: 'Guardar peso' }).click()
    await expect(page.getByText('Peso guardado: 70,1 kg')).toBeVisible()
  })

  test('Progreso, Mi plan, Mis alimentos y Ajustes', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()

    await page.goto('/progreso')
    await expect(page.getByText('Fase · Déficit')).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Avance hacia la meta' })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Progreso')
    await captura(page, info, '08-progreso')

    await page.goto('/mi-plan')
    await expect(page.getByText('Mantenimiento estimado')).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Mi plan')
    await captura(page, info, '09-mi-plan')
    await page.getByRole('button', { name: 'Ajustar' }).click()
    await page.getByLabel('Meta diaria (kcal)').fill('1900')
    await page.getByRole('button', { name: 'Guardar ajustes' }).click()
    await expect(page.getByText('Meta ajustada a mano por ti.')).toBeVisible()

    await page.goto('/mis-alimentos')
    await expect(page.getByText('Crea tu primer alimento')).toBeVisible()
    await revisarAccesibilidad(page, 'Mis alimentos vacío')
    await page.getByRole('link', { name: 'Crear alimento' }).click()
    await page.getByLabel('Nombre', { exact: true }).fill('Pan amasado')
    await page.getByLabel('Kcal').fill('300')
    await page.getByLabel('Proteína (g)').fill('8')
    await page.getByLabel('Carbos (g)').fill('55')
    await page.getByLabel('Grasas (g)').fill('5')
    await revisarAccesibilidad(page, 'Nuevo alimento')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('link', { name: /Pan amasado/ })).toBeVisible()

    await page.goto('/ajustes')
    await page.getByRole('radio', { name: 'Oscuro' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('radio', { name: 'Claro' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.getByRole('radio', { name: 'Sistema' }).click()
    await revisarAccesibilidad(page, 'Ajustes')
    await captura(page, info, '10-ajustes')
  })

  test('funciona sin conexión y conserva los datos', async ({ page, context }) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    // Espera a que el service worker controle la página (modo offline)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.reload()
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await page.getByRole('link', { name: 'Agregar a Once' }).click()
    await page.getByLabel('Buscar alimento').fill('palta')
    await page.getByRole('button', { name: /^Palta/ }).click()
    await page.getByRole('button', { name: 'Agregar a Once' }).click()
    await expect(page.getByText('Palta agregado a Once')).toBeVisible()
    await page.reload()
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Editar Palta/ })).toBeVisible()
    await context.setOffline(false)
  })
})
