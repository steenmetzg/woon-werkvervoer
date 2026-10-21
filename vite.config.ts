/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Relatieve paden, zodat de app ook vanuit een submap online kan staan.
  base: './',
  // Het versienummer uit package.json, getoond onderaan de instellingen.
  define: {
    __APP_VERSION__: JSON.stringify(JSON.parse(readFileSync('./package.json', 'utf8')).version),
  },
  plugins: [
    react(),
    // Service worker: bewaart alle bestanden van de app op de telefoon, zodat hij
    // offline werkt en installeerbaar is. Nieuwe versies worden op de achtergrond
    // opgehaald en zijn actief bij de volgende keer openen.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false, // het manifest staat al in public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
