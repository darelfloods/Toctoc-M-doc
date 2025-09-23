<template>
  <div class="api-diagnostic" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; max-width: 350px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; color: #0369a1; margin-bottom: 8px;">🔍 Diagnostic API</div>

    <div style="margin-bottom: 6px;">
      <strong>Base URL:</strong> {{ currentApiUrl }}
    </div>

    <div style="margin-bottom: 6px;">
      <strong>Auth endpoint:</strong> {{ currentApiUrl }}/auth/login
    </div>

    <div style="margin-bottom: 6px;">
      <strong>Mode:</strong> {{ isDev ? 'Development (Proxy actif)' : 'Production' }}
    </div>

    <div style="margin-bottom: 8px;">
      <strong>Auth store:</strong> {{ authStore.isLoggedIn ? '✅ Connecté' : '❌ Déconnecté' }}
    </div>

    <!-- Test en temps réel -->
    <div style="border-top: 1px solid #bae6fd; padding-top: 8px;">
      <button
        @click="testCurrentConfig"
        :disabled="isTesting"
        style="background: #0ea5e9; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;"
      >
        {{ isTesting ? 'Test...' : 'Test API' }}
      </button>

      <div v-if="testResult" style="margin-top: 6px; padding: 4px; border-radius: 4px;" :style="{ background: testResult.success ? '#dcfce7' : '#fee2e2', color: testResult.success ? '#166534' : '#dc2626' }">
        {{ testResult.message }}
      </div>
    </div>

    <!-- Fermer -->
    <button
      @click="$emit('close')"
      style="position: absolute; top: 4px; right: 6px; background: none; border: none; font-size: 14px; cursor: pointer; color: #64748b;"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ENV } from '@/config/environment'
import API_CONFIG from '@/config/api.config'
import { HttpService } from '@/Services/HttpService'

// Emits
defineEmits(['close'])

// Store
const authStore = useAuthStore()

// Reactive
const isTesting = ref(false)
const testResult = ref<{ success: boolean, message: string } | null>(null)

// Computed
const currentApiUrl = computed(() => {
  // Montrer la vraie URL utilisée par HttpService
  return API_CONFIG.BASE_URL
})
const isDev = computed(() => import.meta.env.DEV)

// Methods
async function testCurrentConfig() {
  isTesting.value = true
  testResult.value = null

  try {
    console.log('🔍 Test API diagnostic vers:', currentApiUrl.value)

    // Test de la route racine
    const response = await HttpService.get('/')

    testResult.value = {
      success: true,
      message: `✅ ${response.data?.msg || 'Connexion OK'}`
    }

    console.log('✅ Diagnostic réussi:', response.data)
  } catch (error: any) {
    console.error('❌ Diagnostic échoué:', error)

    testResult.value = {
      success: false,
      message: `❌ ${error.message || 'Erreur connexion'}`
    }
  } finally {
    isTesting.value = false
  }
}

// Auto-test au montage
onMounted(() => {
  testCurrentConfig()
})
</script>