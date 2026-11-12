import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { captura, completarInicio, revisarAccesibilidad, sinScrollHorizontal } from './ayudas'

// Jueves: la semana va de lunes 2 a domingo 8 de noviembre.
const JUEVES = new Date('2026-11-05T12:00:00-03:00')

/** Carga comidas de 3 días directo en la base del dispositivo (modo local). */
async function cargarComidas(page: Page) {
  await page.evaluate(async () => {
    const abrir = indexedDB.open('kaibu')
    const db: IDBDatabase = await new Promise((ok, mal) => {
      abrir.onsuccess = () => ok(abrir.result)
      abrir.onerror = () => mal(abrir.error)
    })
    const tx = db.transaction('registros', 'readwrite')
    const tabla = tx.objectStore('registros')
    // Meta del perfil de prueba: 1.403 kcal (rango 1.263–1.543) y 141 g de proteína (90 % = 127 g).
    const dias: [string, number, number][] = [
      ['2026-11-02', 1400, 140], // kcal y proteína cumplidas
      ['2026-11-03', 1800, 130], // solo proteína
      ['2026-11-04', 1300, 90], // solo kcal
    ]
    const ahora = new Date().toISOString()
    for (const [fecha, kcal, proteina] of dias) {
      tabla.put({
        id: crypto.randomUUID(),
        userId: 'local',
        fecha,
        comida: 'almuerzo',
        nombre: 'Comida de prueba',
        origen: 'rapido',
        alimentoClave: null,
        gramos: null,
        cantidad: 1,
        unidad: 'porción',
        kcal,
        proteina,
        carbos: 150,
        grasas: 45,
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      })
    }
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
}

/** Deja los consentimientos guardados con la versión anterior de los documentos. */
async function consentimientosAntiguos(page: Page) {
  await page.evaluate(async () => {
    const abrir = indexedDB.open('kaibu')
    const db: IDBDatabase = await new Promise((ok, mal) => {
      abrir.onsuccess = () => ok(abrir.result)
      abrir.onerror = () => mal(abrir.error)
    })
    const tx = db.transaction('consentimientos', 'readwrite')
    const tabla = tx.objectStore('consentimientos')
    const todos: { version: string }[] = await new Promise((ok) => {
      const r = tabla.getAll()
      r.onsuccess = () => ok(r.result)
    })
    for (const c of todos) tabla.put({ ...c, version: '2026-10-25' })
    await new Promise((ok) => (tx.oncomplete = ok))
    db.close()
  })
}

// Cada función nueva se captura sin datos (por defecto) y después de usarla.
test.describe('Kaibu · Etapa 2 · Sprint 2 (modo local)', () => {
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

  test('agua, nota del día y tamaño del vaso', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto('/')
    const agua = page.getByRole('progressbar', { name: 'Agua del día' })
    const nota = page.getByLabel('Nota del día')
    await expect(page.getByText('Aún no anotas agua hoy.')).toBeVisible()
    await expect(nota).toHaveValue('')
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con agua y nota vacías')
    await nota.scrollIntoViewIfNeeded()
    await captura(page, info, '20-agua-nota-vacio')

    // + 3 vasos, − 1 vaso y deshacer: queda en 750 ml.
    const masUno = page.getByRole('button', { name: /1 vaso \(250 ml\)/ })
    for (let i = 0; i < 3; i++) await masUno.click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    await page.getByRole('button', { name: 'Quitar un vaso de 250 ml' }).click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^500 de /)
    await page.getByRole('button', { name: 'Deshacer' }).click()
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    // Al cerrarse, el aviso devuelve el foco al botón tocado: se espera a que termine antes de escribir.
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)

    // La nota se guarda al salir del cuadro y sigue ahí al recargar.
    await nota.fill('Entrené piernas y dormí 7 horas.')
    await page.getByRole('heading', { name: 'Comidas' }).click()
    await expect(page.getByText('Nota guardada')).toBeVisible()
    await page.reload()
    await expect(nota).toHaveValue('Entrené piernas y dormí 7 horas.')
    await expect(agua).toHaveAttribute('aria-valuetext', /^750 de /)
    await expect(page.getByText(/Te faltan .* ml\./)).toBeVisible()
    await nota.scrollIntoViewIfNeeded()
    await captura(page, info, '21-agua-nota-usado')

    // Tamaño del vaso en Ajustes: parte en 250 ml y acepta solo 100 a 1.000 ml.
    await page.getByRole('link', { name: 'Vaso de 250 ml' }).click()
    await expect(page).toHaveURL(/\/ajustes#vaso$/)
    await expect(page.getByRole('radio', { name: '250 ml' })).toBeChecked()
    // La captura de página completa se toma desde arriba (si no, la barra fija queda a media imagen).
    await page.evaluate(() => window.scrollTo(0, 0))
    await captura(page, info, '22-vaso-por-defecto')
    const otro = page.getByLabel('Otro tamaño (ml)')
    await otro.fill('50')
    await otro.press('Enter')
    await expect(page.getByRole('alert')).toContainText('entre 100 y 1.000 ml')
    await otro.fill('')
    await page.getByRole('radio', { name: '500 ml' }).click()
    await expect(page.getByRole('radio', { name: '500 ml' })).toBeChecked()
    await revisarAccesibilidad(page, 'Ajustes con el tamaño del vaso')
    await page.evaluate(() => window.scrollTo(0, 0))
    await captura(page, info, '23-vaso-cambiado')
    await page.goto('/')
    await expect(page.getByRole('button', { name: /1 vaso \(500 ml\)/ })).toBeVisible()
  })
  test('Tu semana: puntaje, barras de kcal y macros (vacía y con comidas)', async ({ page }, info) => {
    await page.clock.setFixedTime(JUEVES)
    await completarInicio(page)
    await page.goto('/progreso')
    await expect(page.getByRole('heading', { name: 'Tu semana está en blanco' })).toBeVisible()
    await revisarAccesibilidad(page, 'Progreso con la semana vacía')
    await captura(page, info, '24-tu-semana-vacia')

    await cargarComidas(page)
    await page.reload()
    const puntaje = (titulo: string) => page.locator('dl > div').filter({ hasText: titulo })
    await expect(puntaje('Kcal en rango')).toContainText('2 de 4 días')
    await expect(puntaje('Proteína ≥ 90 %')).toContainText('2 de 4 días')
    await expect(puntaje('Ambas')).toContainText('1 de 4 días')
    await expect(page.getByRole('img', { name: /Esta semana cumpliste tus kcal 2 de 4 días/ })).toBeVisible()
    await expect(page.getByText('Promedio: 1.500 kcal y 120 g de proteína al día.')).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Progreso con la semana anotada')
    await captura(page, info, '25-tu-semana-con-comidas')

    await page.getByRole('group', { name: 'Período del resumen' }).getByRole('button', { name: 'Mes' }).click()
    await expect(page.getByRole('heading', { name: 'Tu mes' })).toBeVisible()
    await expect(puntaje('Kcal en rango')).toContainText('2 de 5 días')
    await captura(page, info, '26-tu-mes')
  })
  test('compartir mi semana: imagen para historias, sin peso salvo que se active', async ({ page }, info) => {
    // Con el reloj real: con la hora fija las animaciones de la hoja no avanzan y la captura sale sin ella.
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.goto('/progreso')
    // Sin comidas no hay nada que compartir: el botón no aparece.
    await expect(page.getByRole('heading', { name: 'Tu semana está en blanco' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Compartir mi semana/ })).toHaveCount(0)

    // Una comida hoy con kcal en rango (1.263–1.543) y proteína cumplida.
    await page.goto('/agregar')
    await page.getByRole('button', { name: 'Agregar rápido' }).click()
    await page.getByLabel('Kcal').fill('1400')
    await page.getByLabel('Proteína (g)').fill('140')
    await page.getByRole('button', { name: /^Agregar a/ }).click()
    await page.goto('/progreso')
    await page.getByRole('button', { name: 'Compartir mi semana' }).click()
    const hoja = page.getByRole('dialog', { name: 'Compartir mi progreso' })
    const imagen = hoja.getByRole('img', { name: /^Mi semana con Kaibu: 1\/\d días con mis kcal, 1\/\d días con mi proteína/ })
    await expect(imagen).toBeVisible()
    await expect(imagen).not.toHaveAttribute('alt', /peso promedio/)
    await revisarAccesibilidad(page, 'Compartir mi progreso')
    await captura(page, info, '36-compartir-por-defecto', true)

    await hoja.getByLabel('Mostrar mi peso en la imagen').check()
    await expect(hoja.getByRole('img', { name: /70,5 kg peso promedio/ })).toBeVisible()
    await captura(page, info, '37-compartir-con-peso', true)
    const descarga = page.waitForEvent('download')
    await hoja.getByRole('button', { name: 'Descargar imagen' }).click()
    const archivo = await descarga
    expect(archivo.suggestedFilename()).toBe('kaibu-progreso.png')
    await archivo.saveAs(info.outputPath('38-imagen-para-historias.png'))
    await expect(page.getByText(/Imagen descargada/)).toBeVisible()
  })
  test('tutorial guiado la primera vez, y se puede volver a ver', async ({ page }, info) => {
    await completarInicio(page, undefined, true)
    await page.getByRole('button', { name: 'Empezar' }).click()
    const tutorial = page.getByRole('region', { name: 'Tutorial de Kaibu' })
    await expect(tutorial).toContainText('Paso 1 de 4')
    await expect(tutorial.getByRole('heading', { name: 'Anota lo que comes' })).toBeVisible()
    // No bloquea: Hoy se puede usar con el tutorial abierto.
    await expect(page.getByRole('link', { name: 'Agregar a Desayuno' })).toBeEnabled()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Hoy con el tutorial')
    await captura(page, info, '39-tutorial-primer-paso', true)

    for (const titulo of ['Agua y nota del día', 'Tu semana en Progreso', 'Ajustes y tus datos']) {
      await tutorial.getByRole('button', { name: 'Siguiente' }).click()
      await expect(tutorial.getByRole('heading', { name: titulo })).toBeVisible()
    }
    await captura(page, info, '40-tutorial-ultimo-paso', true)
    await tutorial.getByRole('button', { name: 'Listo' }).click()
    await expect(tutorial).toHaveCount(0)
    await captura(page, info, '41-hoy-despues-del-tutorial', true)

    // Solo aparece la primera vez…
    await page.reload()
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await expect(tutorial).toHaveCount(0)
    // …y se vuelve a ver desde Ajustes.
    await page.goto('/ajustes')
    await page.getByRole('link', { name: /Ver tutorial/ }).click()
    await expect(tutorial).toContainText('Paso 1 de 4')
    await tutorial.getByRole('button', { name: 'Saltar' }).click()
    await expect(tutorial).toHaveCount(0)
    await expect(page).toHaveURL(/\/$/)
  })
  test('versión beta y Novedades, con aviso una sola vez tras actualizar', async ({ page }, info) => {
    await completarInicio(page)
    await page.getByRole('button', { name: 'Empezar' }).click()
    // La primera vez no hay aviso de novedades (para eso está el tutorial).
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await expect(page.getByText(/Kaibu se actualizó/)).toHaveCount(0)

    await page.goto('/ajustes')
    const enlace = page.getByRole('link', { name: /Novedades.*Versión 0\.3\.0 · beta/ })
    await expect(enlace).toBeVisible()
    await enlace.click()
    await expect(page).toHaveURL(/\/novedades$/)
    await expect(page.getByText('Estás usando Kaibu 0.3.1 · beta')).toBeVisible()
    await expect(page.getByRole('heading', { name: /0\.2\.1 · beta · Catálogo ampliado/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'En camino' })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Novedades')
    await captura(page, info, '42-novedades')

    // Simula que venía de la versión anterior: al abrir aparece el aviso una sola vez.
    await page.evaluate(() => localStorage.setItem('kaibu:version-vista', '0.1.0'))
    await page.goto('/')
    const aviso = page.getByRole('listitem').filter({ hasText: 'Kaibu se actualizó a la versión 0.3.1 · beta' })
    await expect(aviso).toBeVisible()
    await captura(page, info, '43-aviso-novedades', true)
    await aviso.getByRole('button', { name: 'Ver novedades' }).click()
    await expect(page).toHaveURL(/\/novedades$/)
    await page.goto('/')
    await expect(page.getByText('Kcal restantes')).toBeVisible()
    await page.waitForTimeout(800)
    await expect(page.getByText(/Kaibu se actualizó/)).toHaveCount(0)
  })
  test('Mis datos: descargar en JSON y Excel, y borrar escribiendo BORRAR', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto('/ajustes#mis-datos')
    await expect(page.getByRole('heading', { name: 'Mis datos' })).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 0))
    await captura(page, info, '27-mis-datos')

    const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar (JSON)' }).click()])
    expect(json.suggestedFilename()).toMatch(/^kaibu-mis-datos-\d{4}-\d{2}-\d{2}\.json$/)
    const contenido = JSON.parse(readFileSync(await json.path(), 'utf8'))
    expect(contenido.datos.perfil.nombre).toBe('Ana')
    expect(contenido.datos.consentimientos).toHaveLength(2)
    const [zip] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar para Excel (.zip)' }).click()])
    expect(zip.suggestedFilename()).toMatch(/\.zip$/)
    expect(readFileSync(await zip.path()).subarray(0, 2).toString()).toBe('PK')

    // Borrar: solo se activa al escribir exactamente BORRAR.
    await page.getByRole('button', { name: 'Borrar mis datos de este dispositivo…' }).click()
    const confirmar = page.getByLabel('Escribe BORRAR para confirmar')
    const botonBorrar = page.getByRole('button', { name: 'Borrar todo para siempre' })
    await confirmar.fill('borrar')
    await expect(botonBorrar).toBeDisabled()
    await confirmar.fill('BORRAR')
    await expect(botonBorrar).toBeEnabled()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Ajustes con el borrado abierto')
    await captura(page, info, '28-borrar-confirmar')
    await botonBorrar.click()
    // Sin datos ni sesión, la web vuelve a la landing.
    await expect(page.getByRole('heading', { level: 1, name: /no debería ser una condena/ })).toBeVisible()
    await expect(page.getByText('Tus datos fueron borrados de este dispositivo')).toBeVisible()
    const quedan = await page.evaluate(async () => {
      const abrir = indexedDB.open('kaibu')
      const db: IDBDatabase = await new Promise((ok) => (abrir.onsuccess = () => ok(abrir.result)))
      const n = await new Promise<number>((ok) => {
        const r = db.transaction('perfiles').objectStore('perfiles').count()
        r.onsuccess = () => ok(r.result)
      })
      db.close()
      return n
    })
    expect(quedan).toBe(0)
  })

  test('Legal: licencias y aviso cuando cambia un documento aceptado', async ({ page }, info) => {
    await page.goto('/legal/licencias')
    await expect(page.getByRole('heading', { level: 1, name: 'Licencias de terceros' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'react', exact: true })).toBeVisible()
    await sinScrollHorizontal(page)
    await revisarAccesibilidad(page, 'Licencias')
    await captura(page, info, '29-licencias')
    await page.goto('/legal/terminos')
    await expect(page.getByText('Francisco Carrera · franciscocarrera956@gmail.com · Chile')).toBeVisible()
    await expect(page.getByText(/\[/)).toHaveCount(0)

    await completarInicio(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Actualizamos nuestros documentos' })).toHaveCount(0)
    await consentimientosAntiguos(page)
    await page.reload()
    const aviso = page.getByRole('region', { name: 'Actualizamos nuestros documentos' })
    await expect(aviso).toBeVisible()
    await expect(aviso.getByRole('link', { name: 'Términos y Condiciones' })).toBeVisible()
    await expect(aviso.getByRole('link', { name: 'Política de Privacidad' })).toBeVisible()
    await revisarAccesibilidad(page, 'Hoy con aviso legal')
    await captura(page, info, '30-aviso-legal')
    await aviso.getByRole('button', { name: 'Acepto los cambios' }).click()
    await expect(aviso).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Actualizamos nuestros documentos' })).toHaveCount(0)
    await captura(page, info, '31-aviso-aceptado')
  })
  test('catálogo ampliado: comidas chilenas y su fuente', async ({ page }, info) => {
    await completarInicio(page)
    await page.goto(`/agregar?q=${encodeURIComponent('pastel de choclo')}`)
    await expect(page.getByRole('button', { name: /^Pastel de choclo/ }).first()).toBeVisible()
    await captura(page, info, '32-buscar-pastel-de-choclo-despues')
    await page.goto('/agregar?q=reineta')
    await expect(page.getByRole('button', { name: /^Reineta/ }).first()).toBeVisible()
    await captura(page, info, '33-buscar-reineta-despues')
    await page.goto('/agregar?q=carbonada')
    await expect(page.getByRole('button', { name: /^Carbonada/ }).first()).toBeVisible()
    await page.goto('/agregar?q=soprole')
    await expect(page.getByRole('heading', { name: 'Productos con marca' })).toBeVisible()
    await captura(page, info, '35-buscar-marca-soprole')
    await page.goto(`/agregar?q=${encodeURIComponent('pastel de choclo')}`)
    await page.getByRole('button', { name: /^Pastel de choclo/ }).first().click()
    await expect(page.getByText(/Fuente: Valor estimado desde una receta típica chilena/)).toBeVisible()
    await revisarAccesibilidad(page, 'Ficha de una preparación chilena')
    await captura(page, info, '34-ficha-preparacion')
  })
})
