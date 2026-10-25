import { defineConfig, devices } from '@playwright/test'

// Pruebas de pantallas en celular (390 px) y PC (1440 px), en tema claro y oscuro.
const sizes = [
  { name: 'celular', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: 'pc', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
] as const
const schemes = ['light', 'dark'] as const

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    trace: 'retain-on-failure',
  },
  projects: sizes.flatMap((size) =>
    schemes.map((scheme) => ({
      name: `${size.name}-${scheme === 'light' ? 'claro' : 'oscuro'}`,
      use: {
        ...devices['Desktop Chrome'],
        viewport: size.viewport,
        isMobile: size.isMobile,
        hasTouch: size.hasTouch,
        colorScheme: scheme,
      },
    })),
  ),
  webServer: {
    // Se prueba la versión compilada sin Supabase configurado (modo local).
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
