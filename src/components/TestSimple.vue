<template>
  <div class="test-simple">
    <h3>Test Simple de l'Authentification</h3>
    <div class="form-group mb-3">
      <label class="form-label">Username:</label>
      <input type="text" class="form-control" v-model="testUsername" placeholder="test" />
    </div>
    <div class="form-group mb-3">
      <label class="form-label">Password:</label>
      <input type="password" class="form-control" v-model="testPassword" placeholder="test" />
    </div>

    <div class="d-flex gap-2 mb-3">
      <button @click="testWithFetch" :disabled="isLoading" class="btn btn-primary">
        Test avec fetch
      </button>
      <button @click="testWithHttpService" :disabled="isLoading" class="btn btn-success">
        Test avec HttpService
      </button>
      <button @click="testWithAuthService" :disabled="isLoading" class="btn btn-warning">
        Test avec AuthService
      </button>
    </div>

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
import { HttpService } from '../Services/HttpService'
import { AuthService } from '../Services/AuthService'

const testUsername = ref('test')
const testPassword = ref('test')
const isLoading = ref(false)
const result = ref('')
const error = ref('')

async function testWithFetch() {
  await testAuth('fetch')
}

async function testWithHttpService() {
  await testAuth('httpService')
}

async function testWithAuthService() {
  await testAuth('authService')
}

async function testAuth(method: string) {
  if (!testUsername.value || !testPassword.value) {
    alert('Veuillez remplir username et password')
    return
  }

  isLoading.value = true
  result.value = ''
  error.value = ''

  try {
    console.log(`🧪 Test avec ${method}...`)

    const requestBody = {
      username: testUsername.value,
      password: testPassword.value
    }

    console.log('📤 Body à envoyer:', requestBody)

    let response: any

    switch (method) {
      case 'fetch':
        response = await fetch('https://vps-b9ccb6e1.vps.ovh.net:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        break

      case 'httpService':
        response = await HttpService.post('/auth/login', requestBody)
        break

      case 'authService':
        response = await AuthService.login(requestBody)
        break
    }

    console.log('📡 Réponse reçue:', response)

    if (method === 'fetch') {
      const responseText = await response.text()
      if (response.ok) {
        result.value = `Status: ${response.status}\n\nRéponse: ${responseText}`
      } else {
        error.value = `Erreur HTTP: ${response.status}\n\nRéponse: ${responseText}`
      }
    } else {
      result.value = JSON.stringify(response, null, 2)
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
    error.value = `Erreur avec ${method}: ${errorMessage}`
    console.error(`❌ Erreur avec ${method}:`, err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.test-simple {
  padding: 20px;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin: 20px 0;
  background: #f8f9fa;
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

.gap-2 {
  gap: 0.5rem;
}
</style>
