import { expect, test, type Page } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

const iso = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function agregarRapido(page: Page, fecha: string) {
  await page.goto(`/agregar?fecha=${fecha}`)
  await page.getByRole('button', { name: 'Agregar rápido' }).click()
  await page.getByLabel('Kcal').fill('1400')
  await page.getByLabel('Proteína (g)').fill('140')
  await page.getByRole('button', { name: /^Agregar a/ }).click()
  await expect(page.getByText(/agregad[oa]s? a/).first()).toBeVisible()
}

/** Guarda (o cambia) una sugerencia como si el bot la hubiera publicado o aprobado. */
async function sugerencia(page: Page, estado: string) {
  await page.evaluate(async (estado) => {
    const abrir = indexedDB.open('kaibu')
    const db: IDBDatabase = await new Promise((ok, mal) => {
      abrir.onsuccess = () => ok(abrir.result)
      abrir.onerror = () => mal(abrir.error)
    })
    const tx = db.transaction('reportes', 'readwrite')
    tx.objectStore('reportes').put({
      id: '0f0f0f0f-0000-4000-8000-000000000001', userId: 'local', tipo: 'sugerencia', titulo: 'Metas distintas los días de entreno',
      descripcion: 'Comer más los días que entreno piernas.', plataforma: 'Web', versionApp: '0.2.0-beta', sinConexion: false,
      estado, createdAt: '2026-11-05T09:00:00Z', updatedAt: '2026-11-05T09:00:00Z', deletedAt: null,
    })
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  }, estado)
}

const esPC = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024

test.describe('Kaibu · Comunidad conectada (modo local)', () => {
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

  test('recordatorios de la Comunidad: "Nuevo", invitación discreta en Hoy y enlace al compartir', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()

    // Por defecto (primer día): la Comunidad está marcada como nueva, pero Hoy no muestra invitación.
    if (esPC(page)) await expect(page.getByRole('link', { name: /^Comunidad\s*Nuevo$/ })).toBeVisible()
    else await expect(page.getByRole('link', { name: /Más.*algo nuevo: Comunidad/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: '¿Sabías que Kaibu tiene comunidad?' })).toHaveCount(0)
    const destino = esPC(page) ? '/ajustes' : '/mas'
    await page.goto(destino)
    const fila = page.getByRole('link', { name: /Comunidad.*Discord, reportes y sugerencias.*Nuevo/ })
    await expect(fila).toBeVisible()
    await revisarAccesibilidad(page, 'Más con Comunidad nueva')
    await captura(page, info, '47-comunidad-nueva-por-defecto')

    // Después de usar la app 2 días: invitación discreta al final de Hoy.
    await agregarRapido(page, iso(-1))
    await agregarRapido(page, iso(0))
    await page.goto('/')
    const invitacion = page.getByRole('heading', { name: '¿Sabías que Kaibu tiene comunidad?' })
    await expect(invitacion).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con invitación a la Comunidad')
    await captura(page, info, '48-invitacion-en-hoy')

    // "Ahora no" la esconde (y no vuelve al recargar).
    await page.getByRole('button', { name: 'Ahora no' }).click()
    await expect(invitacion).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(invitacion).toHaveCount(0)

    // Al compartir la semana, sin Discord vinculado: solo un enlace discreto a la Comunidad.
    await page.goto('/progreso')
    await page.getByRole('button', { name: 'Compartir mi semana' }).click()
    const hoja = page.getByRole('dialog', { name: 'Compartir mi progreso' })
    await expect(hoja.getByRole('link', { name: 'Conoce el Discord de Kaibu' })).toBeVisible()
    await expect(hoja.getByRole('button', { name: 'Publicar en el Discord' })).toHaveCount(0)
    await page.keyboard.press('Escape')

    // Después de visitar la Comunidad: ya no se marca como nueva.
    await page.goto('/comunidad')
    await expect(page.getByRole('heading', { level: 1, name: 'Comunidad' })).toBeVisible()
    await page.goto(destino)
    await expect(page.getByRole('link', { name: /Comunidad.*Discord, reportes y sugerencias/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Comunidad.*Nuevo/ })).toHaveCount(0)
    if (!esPC(page)) await expect(page.getByRole('link', { name: /algo nuevo/ })).toHaveCount(0)
    await captura(page, info, '49-comunidad-ya-visitada')
  })

  test('aviso en la app cuando el equipo responde tu sugerencia', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await sugerencia(page, 'publicado')
    await page.goto('/comunidad')
    await expect(page.getByText('Metas distintas los días de entreno')).toBeVisible()
    // Sin cambios no hay aviso.
    await expect(page.getByText(/fue aprobada para construirla/)).toHaveCount(0)

    // El equipo la aprueba en Discord (el bot cambia el estado): al volver a la app aparece el aviso.
    await sugerencia(page, 'aprobada')
    await page.goto('/')
    const aviso = page.getByText('Tu sugerencia "Metas distintas los días de entreno" fue aprobada para construirla')
    await expect(aviso).toBeVisible()
    await revisarAccesibilidad(page, 'Aviso de sugerencia aprobada')
    await captura(page, info, '50-aviso-sugerencia-aprobada', true)
    await page.getByRole('button', { name: 'Ver' }).click()
    await expect(page).toHaveURL(/\/comunidad$/)
    await expect(page.getByText('Aprobada', { exact: true })).toBeVisible()

    // Se avisa una sola vez.
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await page.waitForTimeout(800)
    await expect(aviso).toHaveCount(0)
  })
})
