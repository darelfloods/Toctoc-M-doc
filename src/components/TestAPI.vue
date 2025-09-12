<template>
  <div class="test-api">
    <h3>Test de l'API</h3>
    <button @click="testAPI" :disabled="isLoading">
      {{ isLoading ? 'Test en cours...' : 'Tester l\'API' }}
    </button>
    <div v-if="result" class="mt-3">
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error" class="mt-3 text-danger">
      <strong>Erreur:</strong> {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ENV } from '@/config/environment'

const isLoading = ref(false)
const result = ref('')
const error = ref('')

async function testAPI() {
  isLoading.value = true
  result.value = ''
  error.value = ''

  try {
    console.log('🧪 Test de l\'API...')

    // Test simple avec fetch
    const response = await fetch(`${ENV.API_BASE_URL}/api_epg/all_products/1/5`)

    console.log('📡 Réponse reçue:', response)
    console.log('📊 Status:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      result.value = JSON.stringify(data, null, 2)
      console.log('✅ Données reçues:', data)
    } else {
      error.value = `Erreur HTTP: ${response.status} ${response.statusText}`
      console.error('❌ Erreur HTTP:', response.status, response.statusText)
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur inconnue'
    console.error('❌ Erreur lors du test:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.test-api {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px 0;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
