/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { CAMBIOS, EN_CAMINO } from './src/features/novedades/cambios'

// Política de seguridad de contenido (igual a la de vercel.json).
const CSP =
  "default-src 'self'; script-src 'self' 'sha256-MZwj8/tRzmDFbJzjmIxpWylWp23+v2uEkUKT01PTlVs='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://world.openfoodfacts.org; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"

// Configuración de Vite: React, Tailwind y PWA instalable con modo offline.
const paquete = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/** /novedades.json: la última versión con sus cambios, para que el bot de Discord la anuncie sola en #novedades. */
function novedadesJson(): Plugin {
  return {
    name: 'kaibu-novedades',
    apply: 'build',
    generateBundle() {
      const [ultima] = CAMBIOS
      if (!ultima) return
      const datos = {
        version: ultima.version,
        fecha: ultima.fecha,
        titulo: ultima.titulo,
        anunciar: ultima.anunciar === true,
        puntos: ultima.cambios,
        // Para el panel fijo "Estado de Kaibu" del Discord: lo que viene y las versiones anteriores.
        en_camino: EN_CAMINO,
        versiones: CAMBIOS.map((v) => ({ version: v.version, fecha: v.fecha, titulo: v.titulo })),
      }
      this.emitFile({ type: 'asset', fileName: 'novedades.json', source: JSON.stringify(datos, null, 2) })
    },
  }
}

interface AlimentoJson {
  nombre: string
  marca?: string
  kcal: number
  proteina: number
  carbos: number
  grasas: number
  porcion: { nombre: string; g: number }
  fuente: string
  alias?: string[]
}

/** /catalogo.json: el catálogo completo y compacto, para el comando /alimento del bot de Discord. */
function catalogoJson(): Plugin {
  const leer = (archivo: string) =>
    JSON.parse(readFileSync(new URL(`./src/data/catalogo/${archivo}`, import.meta.url), 'utf8')) as AlimentoJson[]
  return {
    name: 'kaibu-catalogo',
    apply: 'build',
    generateBundle() {
      const lista = [...leer('catalogo-cl.json'), ...leer('mundo.json'), ...leer('productos-cl.json')].map((a) => ({
        n: a.nombre,
        ...(a.marca ? { m: a.marca } : {}),
        k: a.kcal,
        p: a.proteina,
        c: a.carbos,
        g: a.grasas,
        pn: a.porcion.nombre,
        pg: a.porcion.g,
        f: a.fuente,
        ...(a.alias?.length ? { a: a.alias } : {}),
      }))
      this.emitFile({ type: 'asset', fileName: 'catalogo.json', source: JSON.stringify(lista) })
    },
  }
}

export default defineConfig({
  // Versión visible en Más, Ajustes y Novedades.
  define: { __VERSION__: JSON.stringify(paquete.version) },
  plugins: [
    react(),
    tailwindcss(),
    novedadesJson(),
    catalogoJson(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Kaibu',
        short_name: 'Kaibu',
        description: 'Nutrición y progreso, por fases.',
        lang: 'es-CL',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F0D0D',
        theme_color: '#0F0D0D',
        categories: ['health', 'fitness', 'food'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // La escena 3D de la landing (three.js) solo se descarga en la landing, no se guarda por adelantado para la app.
        globIgnores: ['**/escena-*.js'],
        navigateFallback: '/index.html',
        // Las llamadas a Supabase nunca se guardan en caché del service worker:
        // los datos offline viven en IndexedDB (Dexie), separados por usuario.
        navigateFallbackDenylist: [/^\/auth\//],
      },
    }),
  ],
  build: {
    // Archivos grandes a propósito y en su propio chunk: three.js (~580 kB, landing) y los productos con marca
    // (~1,3 MB de datos, 170 kB comprimidos; se cargan al entrar a Agregar y quedan para buscar sin internet).
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        // Librerías grandes en archivos separados: cargan en paralelo y se guardan en caché.
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client', 'react-router', 'scheduler'],
          datos: ['dexie', 'dexie-react-hooks', '@tanstack/react-query'],
        },
      },
    },
  },
  // Mismos encabezados de seguridad que en producción (vercel.json) para probarlos localmente.
  preview: {
    headers: {
      'Content-Security-Policy': CSP.replace(' upgrade-insecure-requests', ''),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
  // Modo desarrollo: prepara librerías y pantallas principales al arrancar (primera carga más rápida).
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react-router',
      'motion/react',
      'dexie',
      'dexie-react-hooks',
      '@tanstack/react-query',
      'lucide-react',
      'sonner',
      'radix-ui',
      'react-hook-form',
      'zod',
      '@hookform/resolvers/zod',
      '@supabase/supabase-js',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
  },
  server: {
    warmup: { clientFiles: ['./src/main.tsx', './src/App.tsx', './src/features/landing/Landing.tsx', './src/features/hoy/Hoy.tsx'] },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
