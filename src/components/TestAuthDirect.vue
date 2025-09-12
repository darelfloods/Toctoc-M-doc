<template>
  <div class="test-auth-direct">
    <h3>Test Direct de l'Authentification (avec fetch)</h3>
    <div class="form-group mb-3">
      <label class="form-label">Username:</label>
      <input type="text" class="form-control" v-model="testUsername" placeholder="Entrez un username" />
    </div>
    <div class="form-group mb-3">
      <label class="form-label">Password:</label>
      <input type="password" class="form-control" v-model="testPassword" placeholder="Entrez un password" />
    </div>
    <button @click="testAuthDirect" :disabled="isLoading" class="btn btn-warning">
      {{ isLoading ? 'Test en cours...' : 'Test Direct (fetch)' }}
    </button>

    <div v-if="result" class="mt-3">
      <h5>Réponse:</h5>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error" class="mt-3 text-danger">
      <h5>Erreur:</h5>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const testUsername = ref('')
const testPassword = ref('')
const isLoading = ref(false)
const result = ref('')
const error = ref('')

async function testAuthDirect() {
  if (!testUsername.value || !testPassword.value) {
    alert('Veuillez remplir username et password')
    return
  }

  isLoading.value = true
  result.value = ''
  error.value = ''

  try {
    console.log('🧪 Test DIRECT de l\'authentification...')
    console.log('👤 Username:', testUsername.value)
    console.log('🔑 Password:', testPassword.value ? '***' : 'vide')

    const requestBody = {
      username: testUsername.value,
      password: testPassword.value
    }

    console.log('📤 Body à envoyer:', requestBody)
    console.log('📤 Body JSON stringifié:', JSON.stringify(requestBody))

    // Test direct avec fetch
    const response = await fetch('https://51.68.46.67:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 Réponse reçue:', response)
    console.log('📊 Status:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📄 Contenu de la réponse:', responseText)

    if (response.ok) {
      try {
        const data = JSON.parse(responseText)
        result.value = JSON.stringify(data, null, 2)
        console.log('✅ Authentification DIRECTE réussie:', data)
      } catch (parseError) {
        result.value = responseText
        console.log('✅ Authentification DIRECTE réussie (réponse non-JSON):', responseText)
      }
    } else {
      try {
        const errorData = JSON.parse(responseText)
        error.value = JSON.stringify(errorData, null, 2)
        console.error('❌ Erreur d\'authentification DIRECTE:', errorData)
      } catch (parseError) {
        error.value = `Erreur HTTP: ${response.status} ${response.statusText}\n\nRéponse: ${responseText}`
        console.error('❌ Erreur HTTP DIRECTE:', response.status, response.statusText)
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
    error.value = errorMessage
    console.error('❌ Erreur lors du test DIRECT:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.test-auth-direct {
  padding: 20px;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin: 20px 0;
  background: #fffbf0;
}

.form-group {
  margin-bottom: 15px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
