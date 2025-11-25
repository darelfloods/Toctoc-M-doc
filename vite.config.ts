import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // Allow access when served through ngrok
    host: true,
    // Permit all hosts so changing ngrok subdomains won't require config edits
    allowedHosts: true,
    port: 5173,        // fixe le port
    strictPort: true,  // oblige Vite à rester sur ce port
    cors: true,        // autorise les appels cross-origin
    proxy: {
      // Proxy vers le backend TTM LOCAL (api_ttm dans le dossier parent)
      '/auth': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/account': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/rate': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/event': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/price_list': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/my_pay_ga': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/sing_pay_api': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      // API EPG vers le backend TTM local
      '/api_epg': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      // Fallback pour anciens endpoints /api
      '/api': {
        target: 'https://api-ttm.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy for reservation products endpoint to bypass CORS in dev
      '/reservations-api': {
        target: 'https://demo2.srv557357.hstgr.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/reservations-api/, ''),
      },
      // Proxy direct vers n8n webhook
      '/n8n-webhook': {
        target: 'https://n8n-workflows-cktx.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/n8n-webhook/, ''),
      },
    },
  },
})
