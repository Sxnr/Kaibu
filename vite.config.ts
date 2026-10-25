/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

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
        navigateFallback: '/index.html',
        // Las llamadas a Supabase nunca se guardan en caché del service worker:
        // los datos offline viven en IndexedDB (Dexie), separados por usuario.
        navigateFallbackDenylist: [/^\/auth\//],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
