<template>
  <div class="backend-test-component p-4 border border-gray-300 rounded-lg bg-gray-50 mb-4">
    <h3 class="text-lg font-bold mb-3">🔧 Test Backend TTM (Dev Only)</h3>

    <!-- Informations de configuration -->
    <div class="config-info mb-4 p-3 bg-blue-100 rounded">
      <h4 class="font-semibold">Configuration actuelle:</h4>
      <ul class="text-sm mt-2">
        <li><strong>Environnement:</strong> {{ configInfo.environment }}</li>
        <li><strong>API Base URL:</strong> {{ configInfo.apiBaseUrl }}</li>
        <li><strong>Proxy configuré:</strong> {{ configInfo.proxyConfigured ? 'Oui' : 'Non' }}</li>
      </ul>
    </div>

    <!-- Tests -->
    <div class="tests-section">
      <div class="test-item mb-3">
        <button
          @click="testConnection"
          :disabled="isTestingConnection"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isTestingConnection ? 'Test en cours...' : 'Tester la connexion' }}
        </button>

        <div v-if="connectionResult" class="mt-2 p-2 rounded" :class="connectionResult.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ connectionResult.message }}
          <pre v-if="connectionResult.data" class="text-xs mt-1 overflow-auto">{{ JSON.stringify(connectionResult.data, null, 2) }}</pre>
        </div>
      </div>

      <div class="test-item mb-3">
        <button
          @click="testAuthEndpoint"
          :disabled="isTestingAuth"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {{ isTestingAuth ? 'Test en cours...' : 'Tester l\'auth endpoint' }}
        </button>

        <div v-if="authResult" class="mt-2 p-2 rounded" :class="authResult.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ authResult.message }}
        </div>
      </div>

      <div class="test-item">
        <button
          @click="testLogin"
          :disabled="isTestingLogin"
          class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {{ isTestingLogin ? 'Test en cours...' : 'Tester login (demo)' }}
        </button>

        <div v-if="loginResult" class="mt-2 p-2 rounded" :class="loginResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ loginResult.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BackendTestService } from '@/Services/BackendTestService'
import { AuthService } from '@/Services/AuthService'

// Réactives
const configInfo = ref(BackendTestService.getConfigInfo())
const connectionResult = ref<any>(null)
const authResult = ref<any>(null)
const loginResult = ref<any>(null)

const isTestingConnection = ref(false)
const isTestingAuth = ref(false)
const isTestingLogin = ref(false)

// Méthodes
async function testConnection() {
  isTestingConnection.value = true
  connectionResult.value = null

  try {
    connectionResult.value = await BackendTestService.testConnection()
  } catch (error) {
    connectionResult.value = {
      status: 'error',
      message: `Erreur inattendue: ${error}`
    }
  } finally {
    isTestingConnection.value = false
  }
}

async function testAuthEndpoint() {
  isTestingAuth.value = true
  authResult.value = null

  try {
    authResult.value = await BackendTestService.testAuthEndpoint()
  } catch (error) {
    authResult.value = {
      status: 'error',
      message: `Erreur inattendue: ${error}`
    }
  } finally {
    isTestingAuth.value = false
  }
}

async function testLogin() {
  isTestingLogin.value = true
  loginResult.value = null

  try {
    // Test avec des credentials de démo (ils échoueront probablement, mais on verra la réponse)
    await AuthService.login({
      username: 'demo@toctocmedoc.com',
      password: 'demopassword'
    })

    loginResult.value = {
      success: true,
      message: 'Login réussi avec les credentials de démo!'
    }
  } catch (error: any) {
    loginResult.value = {
      success: false,
      message: `Login échoué (attendu): ${error.message}`
    }
  } finally {
    isTestingLogin.value = false
  }
}

// Auto-test au montage en mode dev
onMounted(() => {
  if (import.meta.env.DEV) {
    testConnection()
  }
})
</script>

<style scoped>
.backend-test-component {
  font-family: monospace;
}

pre {
  max-height: 200px;
}
</style>