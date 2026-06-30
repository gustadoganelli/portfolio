import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Auditoria Interna (Demo)',
        short_name: 'Auditoria',
        description: 'Auditoria interna em campo - funciona offline.',
        lang: 'pt-BR',
        theme_color: '#163e5c',
        background_color: '#f4f5f7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      // Cacheia o app (HTML/JS/CSS) para abrir sem internet no build de producao.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json}'],
        maximumFileSizeToCacheInBytes: 4194304,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, host: true },
})
