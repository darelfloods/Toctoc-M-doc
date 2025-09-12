import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css' // utilitaires responsive

import App from './App.vue'
import router from './router'
import { AuthService } from './Services/AuthService'

// Import webhook tester in development
if (import.meta.env.DEV) {
  import('./utils/webhookTester').then(({ WebhookTester }) => {
    console.log('🧪 Webhook tester loaded. Use testWebhook() or checkWebhook() in console.')
  })
  
  import('./utils/webhookDiagnostic').then(({ WebhookDiagnostic }) => {
    console.log('🔍 Webhook diagnostic loaded. Use runWebhookDiagnostic() in console.')
  })
  
  import('./utils/quickWebhookTest').then(({ quickWebhookTest }) => {
    console.log('⚡ Quick webhook test loaded. Use quickWebhookTest() in console.')
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura, // Aura est un preset multi-variants
    options: {
      prefix: 'p', // préfixe des classes CSS (optionnel)
      darkModeSelector: '.p-dark', // pour gérer le switch (optionnel)
      cssLayer: {
        name: 'primevue', // évite les conflits
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})

// Initialiser l'authentification après que Pinia soit configuré
AuthService.initializeAuth()

app.mount('#app')
