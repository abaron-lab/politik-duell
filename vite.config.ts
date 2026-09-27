import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Service Worker: speichert nur die App selbst (HTML, JS, CSS, Icons), damit sie
    // installiert und ohne Netz startet. Anfragen an Supabase und die KI laufen
    // immer live – Spielstände oder Eingaben landen nie im Cache.
    VitePWA({
      registerType: 'autoUpdate',
      // Externe registerSW.js statt Inline-Skript (Content-Security-Policy: script-src 'self')
      injectRegister: 'script',
      // Das Manifest liegt schon in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },
    }),
  ],
})
