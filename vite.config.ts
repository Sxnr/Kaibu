/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Política de seguridad de contenido (igual a la de vercel.json).
const CSP =
  "default-src 'self'; script-src 'self' 'sha256-MZwj8/tRzmDFbJzjmIxpWylWp23+v2uEkUKT01PTlVs='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"

// Configuración de Vite: React, Tailwind y PWA instalable con modo offline.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    // three.js (~580 kB) va en su propio archivo y se carga después de pintar la landing.
    chunkSizeWarningLimit: 650,
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
