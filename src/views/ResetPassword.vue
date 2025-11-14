<template>
  <div class="reset-password-page">
    <div class="container">
      <div class="reset-card">
        <div class="logo-section">
          <img src="/assets/Fichier 12.svg" alt="Toc Toc Medoc" class="logo" />
        </div>

        <div class="content-section">
          <h2 class="title">Réinitialiser votre mot de passe</h2>

          <!-- Message d'erreur si le token est invalide -->
          <div v-if="tokenError" class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            {{ tokenError }}
          </div>

          <!-- Formulaire de réinitialisation -->
          <form v-else-if="!resetSuccess" @submit.prevent="handleSubmit" class="reset-form">
            <div class="form-group">
              <label for="newPassword" class="form-label">Nouveau mot de passe*</label>
              <div class="password-input-wrapper">
                <input
                  id="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="newPassword"
                  class="form-control"
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                  minlength="8"
                />
                <button
                  type="button"
                  class="btn-eye"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <small class="form-text">Le mot de passe doit contenir au moins 8 caractères</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Confirmer le mot de passe*</label>
              <div class="password-input-wrapper">
                <input
                  id="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="confirmPassword"
                  class="form-control"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                  minlength="8"
                />
                <button
                  type="button"
                  class="btn-eye"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Message d'erreur -->
            <div v-if="errorMessage" class="alert alert-danger">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage }}
            </div>

            <!-- Boutons -->
            <div class="button-group">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="!canSubmit || isLoading"
              >
                <span v-if="isLoading">
                  <i class="fas fa-spinner fa-spin"></i> Réinitialisation...
                </span>
                <span v-else>Réinitialiser le mot de passe</span>
              </button>
            </div>
          </form>

          <!-- Message de succès -->
          <div v-else class="success-section">
            <div class="alert alert-success">
              <i class="fas fa-check-circle"></i>
              <h3>Mot de passe réinitialisé avec succès !</h3>
              <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            </div>
            <router-link to="/" class="btn btn-primary">
              <i class="fas fa-home"></i> Retour à l'accueil
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthService } from '@/Services/AuthService'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const tokenError = ref('')
const resetSuccess = ref(false)

const canSubmit = computed(() => {
  return (
    newPassword.value.length >= 8 &&
    confirmPassword.value.length >= 8 &&
    newPassword.value === confirmPassword.value
  )
})

onMounted(() => {
  // Récupérer le token depuis l'URL
  token.value = route.query.token as string || ''

  if (!token.value) {
    tokenError.value = 'Lien de réinitialisation invalide. Veuillez demander un nouveau lien.'
  }
})

async function handleSubmit() {
  if (!canSubmit.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas ou sont trop courts (min. 8 caractères)'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await AuthService.resetPassword(token.value, newPassword.value)
    resetSuccess.value = true

    // Rediriger vers la page d'accueil après 3 secondes
    setTimeout(() => {
      router.push('/')
    }, 3000)
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation:', error)

    // Messages d'erreur personnalisés
    if (error?.message?.includes('expiré')) {
      errorMessage.value = 'Ce lien a expiré. Veuillez demander un nouveau lien de réinitialisation.'
    } else if (error?.message?.includes('utilisé')) {
      errorMessage.value = 'Ce lien a déjà été utilisé. Veuillez demander un nouveau lien si nécessaire.'
    } else if (error?.message?.includes('invalide')) {
      errorMessage.value = 'Lien de réinitialisation invalide. Veuillez vérifier votre email ou demander un nouveau lien.'
    } else {
      errorMessage.value = error?.message || 'Une erreur est survenue. Veuillez réessayer.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 500px;
  width: 100%;
}

.reset-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logo-section {
  background-color: #f8f9fa;
  padding: 30px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.logo {
  max-width: 200px;
  height: auto;
}

.content-section {
  padding: 40px 30px;
}

.title {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 30px;
  font-family: sans-serif;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  font-family: sans-serif;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control {
  width: 100%;
  padding: 12px 45px 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.3s;
  color: #333 !important;
}

.form-control:focus {
  outline: none;
  border-color: #0F7ABB;
  box-shadow: 0 0 0 3px rgba(15, 122, 187, 0.1);
}

.form-control::placeholder {
  color: #6c757d !important;
}

.btn-eye {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-eye:hover {
  color: #0F7ABB;
}

.btn-eye:focus {
  outline: none;
}

.form-text {
  color: #6c757d;
  font-size: 14px;
}

.alert {
  padding: 15px 20px;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 15px;
}

.alert i {
  font-size: 20px;
  margin-top: 2px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  flex-direction: column;
  text-align: center;
}

.alert-success h3 {
  margin: 10px 0 5px;
  font-size: 20px;
  color: #155724;
}

.alert-success p {
  margin: 0;
  color: #155724;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.btn {
  padding: 12px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background-color: #0F7ABB;
  color: white;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0d6aa0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 122, 187, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

@media (max-width: 576px) {
  .content-section {
    padding: 30px 20px;
  }

  .title {
    font-size: 20px;
  }

  .form-control {
    font-size: 14px;
  }

  .btn {
    font-size: 14px;
    padding: 10px 20px;
  }
}
</style>
