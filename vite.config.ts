import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Backend Laravel local par défaut ; surcharger avec VITE_DEV_PROXY_TARGET si besoin */
  const laravelTarget = (env.VITE_DEV_PROXY_TARGET || 'https://backend.srv1079351.hstgr.cloud').replace(/\/+$/, '')

  const isHttps = laravelTarget.startsWith('https')
  const laravelApiRewrite = {
    target: laravelTarget,
    changeOrigin: true,
    secure: isHttps,
    timeout: 60000,
    proxyTimeout: 60000,
    rewrite: (path: string) => '/api' + path,
  }

  return {
    plugins: [vue(), vueJsx(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      allowedHosts: true,
      port: 5173,
      strictPort: true,
      cors: true,
      proxy: {
        '/auth': laravelApiRewrite,
        '/user': laravelApiRewrite,
        '/account': laravelApiRewrite,
        '/rate': laravelApiRewrite,
        '/event': laravelApiRewrite,
        '/price_list': laravelApiRewrite,
        '/my_pay_ga': laravelApiRewrite,
        '/sing_pay_api': laravelApiRewrite,
        '/api_epg': laravelApiRewrite,
        '/api': {
          target: laravelTarget,
          changeOrigin: true,
          secure: isHttps,
          timeout: 60000,
          proxyTimeout: 60000,
        },
        '/reservations-api': {
          target: 'https://demo2.srv557357.hstgr.cloud',
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/reservations-api/, ''),
        },
        '/n8n-webhook': {
          target: 'https://n8n-workflows-cktx.onrender.com',
          changeOrigin: true,
          secure: true,
          timeout: 60000,
          proxyTimeout: 60000,
          rewrite: (path: string) => path.replace(/^\/n8n-webhook/, ''),
        },
        '/epharma-api': {
          target: 'https://epharma-panel.srv557357.hstgr.cloud',
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/epharma-api/, ''),
        },
      },
    },
  }
})
