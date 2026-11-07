// Pantallas reales de Kaibu para los 6 videos de la Etapa 3 (modo local, navegador temporal).
// Uso: con la app en `npm run preview -- --port 4173`, correr `node scripts/capturar-etapa3.mjs` desde video/.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.KAIBU_URL ?? 'http://localhost:4173'
const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'capturas')
mkdirSync(SALIDA, { recursive: true })

const esperar = (page, ms = 700) => page.waitForTimeout(ms)
async function foto(page, nombre) {
  await esperar(page)
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`) })
  console.log('  ✓', nombre)
}

/** Registro local y cuestionario (persona de ejemplo que entrena). */
async function inicio(page) {
  await page.addInitScript(() => localStorage.setItem('kaibu:tutorial-visto', '1'))
  await page.goto(BASE + '/')
  await page.getByRole('link', { name: /Empezar gratis/ }).click()
  await page.getByRole('button', { name: 'Saltar' }).click()
  await page.getByLabel('Acepto los Términos y Condiciones').check()
  await page.getByLabel(/Doy mi consentimiento/).check()
  await page.getByRole('button', { name: 'Usar en este dispositivo' }).click()
  const continuar = page.getByRole('button', { name: 'Continuar' })
  await page.getByLabel('Nombre').fill('Seba')
  await continuar.click()
  await page.getByRole('radio', { name: 'Hombre' }).click()
  await continuar.click()
  await page.getByLabel('Fecha de nacimiento').fill('1998-06-12')
  await continuar.click()
  await page.getByLabel('Estatura (cm)').fill('176')
  await continuar.click()
  await page.getByLabel('Peso actual (kg)').fill('82')
  await continuar.click()
  await page.getByRole('radio', { name: /Mayormente sentado/ }).click()
  await continuar.click()
  await page.getByRole('radio', { name: '4', exact: true }).click()
  await continuar.click()
  await page.getByRole('radio', { name: /Perder grasa/ }).click()
  await continuar.click()
  await page.getByLabel('Peso meta (kg)').fill('76')
  await continuar.click()
  await continuar.click()
  await page.getByRole('radio', { name: /4 comidas/ }).click()
  await page.getByRole('button', { name: 'Ver mi plan' }).click()
  await page.getByRole('heading', { name: 'Tu plan' }).waitFor()
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.getByText('Kcal restantes').waitFor()
}

async function buscar(page, texto, comida = 'Almuerzo') {
  await page.goto(BASE + '/agregar')
  await page.getByRole('radio', { name: comida }).click()
  await page.getByLabel('Buscar alimento').fill(texto)
  await esperar(page, 900)
}

async function ficha(page, texto, nombre, archivo) {
  await buscar(page, texto)
  await page.getByRole('button', { name: new RegExp(`^${nombre}`) }).first().click()
  await page.getByRole('dialog').waitFor()
  await foto(page, archivo)
  await page.keyboard.press('Escape')
}

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light', locale: 'es-CL' })
const page = await contexto.newPage()
await inicio(page)

await buscar(page, 'arroz con pollo')
await foto(page, 'e3-busqueda-arroz')
await ficha(page, 'arroz con pollo', 'Arroz con pollo \\(arroz y pechuga\\)', 'e3-ficha-arroz')
await ficha(page, 'completo italiano', 'Completo italiano', 'e3-ficha-completo')
await ficha(page, 'carne molida 5', 'Carne molida 5 % grasa, cocida', 'e3-ficha-carne5')
await ficha(page, 'carne molida 10', 'Carne molida 10 % grasa, cocida', 'e3-ficha-carne10')

for (const [texto, archivo] of [
  ['cazuela', 'e3-busqueda-cazuela'],
  ['porotos con riendas', 'e3-busqueda-porotos'],
  ['pastel de choclo', 'e3-busqueda-pastel'],
  ['completo', 'e3-busqueda-completo'],
  ['chorrillana', 'e3-busqueda-chorrillana'],
  ['avena con whey', 'e3-busqueda-avena'],
]) {
  await buscar(page, texto)
  await foto(page, archivo)
}
// Los productos con marca se cargan aparte: se espera a que aparezca la sección.
await buscar(page, 'soprole protein')
await page.getByRole('heading', { name: 'Productos con marca' }).waitFor()
await foto(page, 'e3-busqueda-protein')
await buscar(page, 'marraqueta', 'Once')
await foto(page, 'e3-once')

await navegador.close()
console.log('Listo →', SALIDA)
