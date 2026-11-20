import { test } from '@playwright/test'
import { completarInicio } from './ayudas'
test('captura receta', async ({ page }) => {
  await completarInicio(page)
  await page.getByRole('button', { name: 'Empezar' }).click()
  await page.goto('/planificar')
  await page.getByRole('link', { name: 'Nueva preparación' }).click()
  await page.getByLabel('Nombre').fill('X')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: '/tmp/claude-0/-home-user-Kaibu/cd69823b-e23a-5e38-b1a3-bd6c676eee83/scratchpad/receta.png', fullPage: true })
  await page.screenshot({ path: '/tmp/claude-0/-home-user-Kaibu/cd69823b-e23a-5e38-b1a3-bd6c676eee83/scratchpad/receta-vista.png' })
  console.log(await page.evaluate(() => [document.documentElement.scrollHeight, getComputedStyle(document.querySelector('main')!).opacity, document.querySelector('main')?.innerText.slice(0, 80)]))
})
