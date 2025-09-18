<template>
  <div class="test-auth">
    <h3>Test de l'Authentification</h3>
    <div class="form-group mb-3">
      <label class="form-label">Username:</label>
      <input type="text" class="form-control" v-model="testUsername" placeholder="Entrez un username" />
    </div>
    <div class="form-group mb-3">
      <label class="form-label">Password:</label>
      <input type="password" class="form-control" v-model="testPassword" placeholder="Entrez un password" />
    </div>
    <button @click="testAuth" :disabled="isLoading" class="btn btn-primary">
      {{ isLoading ? 'Test en cours...' : 'Tester l\'authentification' }}
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

async function testAuth() {
  if (!testUsername.value || !testPassword.value) {
    alert('Veuillez remplir username et password')
    return
  }

  isLoading.value = true
  result.value = ''
  error.value = ''

  try {
    console.log('🧪 Test de l\'authentification...')
    console.log('👤 Username:', testUsername.value)
    console.log('🔑 Password:', testPassword.value ? '***' : 'vide')

    // Test direct de l'endpoint d'authentification
    const response = await fetch('https://vps-b9ccb6e1.vps.ovh.net:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUsername.value,
        password: testPassword.value
      })
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
        console.log('✅ Authentification réussie:', data)
      } catch (parseError) {
        result.value = responseText
        console.log('✅ Authentification réussie (réponse non-JSON):', responseText)
      }
    } else {
      try {
        const errorData = JSON.parse(responseText)
        error.value = JSON.stringify(errorData, null, 2)
        console.error('❌ Erreur d\'authentification:', errorData)
      } catch (parseError) {
        error.value = `Erreur HTTP: ${response.status} ${response.statusText}\n\nRéponse: ${responseText}`
        console.error('❌ Erreur HTTP:', response.status, response.statusText)
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
    error.value = errorMessage
    console.error('❌ Erreur lors du test:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.test-auth {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px 0;
  background: #f9f9f9;
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
