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
      // Proxy vers le backend TTM LOCAL (Laravel) – les routes Laravel sont sous /api/
      '/auth': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/user': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/account': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/rate': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/event': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/price_list': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/my_pay_ga': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      '/sing_pay_api': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      // API EPG vers le backend TTM local
      '/api_epg': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => '/api' + path,
      },
      // Fallback – ajoute le préfixe /api pour tout endpoint non-matché ci-dessus
      '/api': {
        target: 'https://backend.srv1079351.hstgr.cloud',
        changeOrigin: true,
        secure: false,
      },
      // Proxy for reservation products endpoint to bypass CORS in dev
      '/reservations-api': {
        target: 'https://demo2.srv557357.hstgr.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/reservations-api/, ''),
      },
      // Proxy direct vers n8n webhook
      '/n8n-webhook': {
        target: 'https://n8n-workflows-cktx.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/n8n-webhook/, ''),
      },
      // Proxy vers epharma-panel API pour contourner CORS en dev
      '/epharma-api': {
        target: 'https://epharma-panel.srv557357.hstgr.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/epharma-api/, ''),
      },
    },
  },
})
