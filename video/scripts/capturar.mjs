// Captura pantallas reales de Kaibu (modo local) con datos de ejemplo, solo para el video.
// Los datos viven en un navegador temporal: no quedan en la app ni en Supabase.
// Uso: desde la raíz, compilar con Supabase vacío y abrir `npm run preview -- --port 4173`;
// luego `npm run capturar --prefix video`.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.KAIBU_URL ?? 'http://localhost:4173'
const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'capturas')
mkdirSync(SALIDA, { recursive: true })

// Oculta la barra inferior fija y los avisos para que las capturas de página completa queden limpias.
const SIN_FIJOS = 'nav[aria-label="Principal"], [data-sonner-toaster] { display: none !important; }'

const iso = (dias) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const esperar = (page, ms = 700) => page.waitForTimeout(ms)

async function foto(page, nombre, { completa = false, sinFijos = completa } = {}) {
  const estilo = sinFijos ? await page.addStyleTag({ content: SIN_FIJOS }) : null
  await esperar(page)
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`), fullPage: completa })
  if (estilo) await estilo.evaluate((e) => e.remove())
  console.log('  ✓', nombre)
}

async function inicio(page) {
  await page.goto(BASE + '/')
  await page.getByRole('link', { name: /Empezar gratis/ }).click()
  await page.getByRole('button', { name: 'Saltar' }).click()
  await page.getByLabel('Acepto los Términos y Condiciones').check()
  await page.getByLabel(/Doy mi consentimiento/).check()
  await page.getByRole('button', { name: 'Usar en este dispositivo' }).click()
  const continuar = page.getByRole('button', { name: 'Continuar' })
  await page.getByLabel('Nombre').fill('Ana')
  await continuar.click()
  await page.getByRole('radio', { name: 'Mujer' }).click()
  await continuar.click()
  await page.getByLabel('Fecha de nacimiento').fill('1995-04-10')
  await continuar.click()
  await page.getByLabel('Estatura (cm)').fill('165')
  await continuar.click()
  await page.getByLabel('Peso actual (kg)').fill('70,5')
  await continuar.click()
  await page.getByRole('radio', { name: /Mayormente sentado/ }).click()
  await continuar.click()
  await page.getByRole('radio', { name: '3', exact: true }).click()
  await continuar.click()
  await page.getByRole('radio', { name: /Perder grasa/ }).click()
  await continuar.click()
  await page.getByLabel('Peso meta (kg)').fill('64')
  await continuar.click()
  await continuar.click()
  await page.getByRole('radio', { name: /4 comidas/ }).click()
  await page.getByRole('button', { name: 'Ver mi plan' }).click()
  await page.getByRole('heading', { name: 'Tu plan' }).waitFor()
}

/** Días anteriores cumplidos (agregado rápido) para que se vea la racha y la semana. */
async function diasAnteriores(page, dias) {
  for (let d = dias; d >= 1; d--) {
    await page.goto(`${BASE}/agregar?fecha=${iso(-d)}`)
    await page.getByRole('radio', { name: 'Almuerzo' }).click()
    await page.getByRole('button', { name: 'Agregar rápido' }).click()
    await page.getByLabel('Kcal').fill(String(1340 + ((d * 37) % 140)))
    await page.getByLabel('Proteína (g)').fill(String(118 + (d % 5) * 4))
    await page.getByRole('button', { name: 'Agregar a Almuerzo' }).click()
    await page.getByText(/agregadas a Almuerzo/).first().waitFor()
  }
}

/** Pesos a la baja (con algo de ruido, como en la vida real). */
async function pesos(page) {
  const serie = [
    [-35, '70,5'], [-31, '70,3'], [-28, '70,1'], [-24, '69,8'], [-21, '69,9'], [-17, '69,4'],
    [-14, '69,1'], [-10, '68,9'], [-7, '68,6'], [-5, '68,4'], [-3, '68,2'], [-1, '68,0'], [0, '67,9'],
  ]
  await page.goto(BASE + '/progreso')
  for (const [dias, kg] of serie) {
    await page.getByRole('button', { name: 'Registrar peso' }).click()
    await page.getByLabel('Peso (kg)').fill(kg)
    await page.getByLabel('Fecha').fill(iso(dias))
    await page.getByRole('button', { name: 'Guardar peso' }).click()
    await page.getByText(/Peso guardado/).first().waitFor()
    await esperar(page, 250)
  }
}

async function agregarAlimento(page, comida, busqueda, nombre) {
  await page.goto(BASE + '/agregar')
  await page.getByRole('radio', { name: comida }).click()
  await page.getByLabel('Buscar alimento').fill(busqueda)
  await page.getByRole('button', { name: new RegExp(`^${nombre}`) }).first().click()
  await page.getByRole('button', { name: `Agregar a ${comida}` }).click()
  await page.getByText(new RegExp(`agregad[oa]s? a ${comida}`)).first().waitFor()
}

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light', locale: 'es-CL' })
const page = await contexto.newPage()

await inicio(page)
await foto(page, 'tu-plan', { completa: true })
await page.getByRole('button', { name: 'Empezar' }).click()
await page.getByText('Kcal restantes').waitFor()

await diasAnteriores(page, 12)
await pesos(page)
await agregarAlimento(page, 'Desayuno', 'marraqueta', 'Marraqueta')
await agregarAlimento(page, 'Desayuno', 'palta', 'Palta')
await agregarAlimento(page, 'Desayuno', 'huevo', 'Huevo')
await agregarAlimento(page, 'Almuerzo', 'pechuga', 'Pechuga de pollo')

// Agregar: recientes y búsqueda en curso
const barra = (nombre) => page.locator('nav[aria-label="Principal"]:visible').first().screenshot({ path: path.join(SALIDA, `${nombre}.png`) })

await page.goto(BASE + '/agregar')
await foto(page, 'agregar', { completa: true })
await barra('barra-agregar')
await page.getByLabel('Buscar alimento').fill('marraq')
await foto(page, 'agregar-busqueda')
await page.getByRole('button', { name: /^Marraqueta/ }).first().click()
await page.getByRole('dialog').waitFor()
await foto(page, 'ficha')
await page.keyboard.press('Escape')

// Hoy
await page.goto(BASE + '/')
await page.getByText('Kcal restantes').waitFor()
await foto(page, 'hoy', { completa: true })
await foto(page, 'hoy-pantalla', { sinFijos: false })
await esperar(page)
await barra('barra-hoy')

// Progreso
await page.goto(BASE + '/progreso')
await page.getByText('Registros de peso').waitFor()
await foto(page, 'progreso', { completa: true })
await barra('barra-progreso')

// Mi plan (con la explicación de cada número)
await page.goto(BASE + '/mi-plan')
await page.getByText('Mantenimiento estimado').waitFor()
await foto(page, 'mi-plan', { completa: true })

// Tema oscuro
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(BASE + '/')
await page.getByText('Kcal restantes').waitFor()
await foto(page, 'hoy-oscuro', { sinFijos: false })

await navegador.close()
console.log('Listo →', SALIDA)
