<template>
  <div class="auth-test-component p-4 border border-blue-300 rounded-lg bg-blue-50 mb-4">
    <h3 class="text-lg font-bold mb-3">🔐 Test Authentification TTM (Dev Only)</h3>

    <div class="flex flex-col space-y-4">
      <!-- Formulaire de test -->
      <div class="bg-white p-4 rounded shadow">
        <h4 class="font-semibold mb-3">Test de connexion</h4>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">Email:</label>
            <input
              v-model="loginForm.username"
              type="email"
              class="w-full p-2 border rounded"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Mot de passe:</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="w-full p-2 border rounded"
              placeholder="password"
            />
          </div>

          <div class="flex space-x-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {{ isLoading ? 'Connexion...' : 'Se connecter' }}
            </button>

            <button
              type="button"
              @click="handleAdminLogin"
              :disabled="isLoading"
              class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {{ isLoading ? 'Connexion...' : 'Connexion Admin' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Résultats -->
      <div v-if="result" class="bg-white p-4 rounded shadow">
        <h4 class="font-semibold mb-2">Résultat:</h4>
        <div
          class="p-3 rounded text-sm"
          :class="result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
        >
          <div><strong>Status:</strong> {{ result.success ? 'Succès' : 'Échec' }}</div>
          <div><strong>Message:</strong> {{ result.message }}</div>
          <div v-if="result.data" class="mt-2">
            <strong>Données:</strong>
            <pre class="mt-1 text-xs overflow-auto bg-gray-100 p-2 rounded max-h-32">{{ JSON.stringify(result.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- État de l'authentification -->
      <div class="bg-white p-4 rounded shadow">
        <h4 class="font-semibold mb-2">État de l'authentification:</h4>
        <div class="text-sm">
          <div><strong>Connecté:</strong> {{ authStore.isLoggedIn ? 'Oui' : 'Non' }}</div>
          <div v-if="authStore.currentUser">
            <strong>Utilisateur:</strong> {{ authStore.currentUser.pseudo || authStore.currentUser.name || authStore.currentUser.email }}
          </div>
          <div v-if="authStore.authToken">
            <strong>Token:</strong> {{ authStore.authToken.substring(0, 20) }}...
          </div>
        </div>

        <button
          v-if="authStore.isLoggedIn"
          @click="handleLogout"
          class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { AuthService } from '@/Services/AuthService'
import { useAuthStore } from '@/stores/auth'

// Store
const authStore = useAuthStore()

// Réactives
const isLoading = ref(false)
const result = ref<any>(null)

const loginForm = reactive({
  username: '',
  password: ''
})

// Méthodes
async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    result.value = {
      success: false,
      message: 'Veuillez remplir tous les champs'
    }
    return
  }

  isLoading.value = true
  result.value = null

  try {
    const response = await AuthService.login({
      username: loginForm.username,
      password: loginForm.password
    })

    result.value = {
      success: true,
      message: 'Connexion réussie !',
      data: response
    }

    // Reset form
    loginForm.username = ''
    loginForm.password = ''
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.message || 'Erreur de connexion',
      data: error
    }
  } finally {
    isLoading.value = false
  }
}

async function handleAdminLogin() {
  if (!loginForm.username || !loginForm.password) {
    result.value = {
      success: false,
      message: 'Veuillez remplir tous les champs'
    }
    return
  }

  isLoading.value = true
  result.value = null

  try {
    const response = await AuthService.loginAdmin({
      username: loginForm.username,
      password: loginForm.password
    })

    result.value = {
      success: true,
      message: 'Connexion admin réussie !',
      data: response
    }

    // Reset form
    loginForm.username = ''
    loginForm.password = ''
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.message || 'Erreur de connexion admin',
      data: error
    }
  } finally {
    isLoading.value = false
  }
}

async function handleLogout() {
  try {
    await AuthService.logout()
    result.value = {
      success: true,
      message: 'Déconnexion réussie'
    }
  } catch (error: any) {
    result.value = {
      success: false,
      message: 'Erreur lors de la déconnexion'
    }
  }
}
</script>

<style scoped>
.auth-test-component {
  font-family: system-ui, sans-serif;
}

pre {
  font-family: 'Courier New', monospace;
}
</style>