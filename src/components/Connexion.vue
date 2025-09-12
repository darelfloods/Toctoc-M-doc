<template>
  <div v-if="visible">
    <!-- Modal de connexion (reproduction de connexion.component.html) -->
    <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-item" style="border: none; display: inline-block;">
            <button type="button" class="btn-close p-2 mt-1 float-end rounded-circle"
              style="background-color: #E6E6E6; margin-right: 5px;" aria-label="Close" @click="onClose">
              &times;
            </button>
          </div>

          <div class="modal-body pe-0 ps-0" style="display: inline-block;">
            <div class="col pt-0 pb-1" style="display: inline-block;">
              <div class="col d-flex justify-content-center">
                <img class="img-fluid" src="../assets/Fichier 12.svg" alt="logo_ttm" width="200" height="100">
              </div>
              <div class="text-center" style="display: inline-block;">
                <h3 class="text-dark" style="display: inline-block;font-family: sans-serif;">Bienvenue</h3>
                <p class="border-bottom border-1 px-5 text-dark"
                  style="font-family: sans-serif;font-size: 16px;display: inline-block;">
                  Connectez-vous et trouvez votre médicament
                </p>
              </div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <form class="col-md-8 pe-0 ps-0" @submit.prevent>
                <div class="mb-3">
                  <label for="username1" class="form-label mb-1 text-dark"
                    style="font-size: 16px;font-weight: 600;font-family: sans-serif;">Nom d'utilisateur*</label>
                  <input id="username1" type="text" class="form-control" style="border-radius: 15px"
                    placeholder="Entrez votre nom d'utilisateur" v-model="username">
                </div>
                <div class="mb-3">
                  <div>
                    <label for="password1" class="form-label mb-1 text-dark"
                      style="font-size: 16px;font-weight: 600;font-family: sans-serif;">
                      Mot de passe*
                      <a href="#" @click.prevent="onForgotPassword" class="text-dark"
                        style="font-size: 16px; margin-left: 50px;font-family: sans-serif;">Mot de passe oublié?</a>
                    </label>
                  </div>
                  <div class="position-relative">
                    <input id="password1" :type="showPassword ? 'text' : 'password'" class="form-control" style="border-radius: 15px; padding-right: 40px;"
                      placeholder="Entrez le mot de passe" v-model="password">
                    <button type="button" class="btn-eye" @click="showPassword = !showPassword"
                      :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="d-flex justify-content-center col modal-item pb-5" style="border: none;">
            <div class="col text-center" style="display: inline-block;">
              <div class="mb-1">
                <button type="button" class="btn btn-custom mt-1 col-md-8"
                  style="border-radius: 15px; background-color: #0F7ABB;font-family: sans-serif;color: white;"
                  @click="login" :disabled="isLoading">
                  {{ isLoading ? 'Connexion...' : 'Connexion' }}
                </button>
                <div v-if="message === 'Connexion réussie !'" style="top: 0px;" class="fs-1 text-success">{{ message }}
                </div>
              </div>
              <div>
                <p class="text-dark">Vous n'avez pas de compte ?</p>
                <button type="button" class="btn btn-custom mt-1 col-md-8"
                  style="border-radius: 15px; background-color: #0F7ABB;font-family: sans-serif;color: white;"
                  @click="onOpenInscription">
                  S'inscrire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>

    <!-- Toasts de retour -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1055;">
      <div v-show="showSuccessToast" class="toast align-items-center text-white bg-success border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">Connexion réussie !</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto"
            @click="showSuccessToast = false"></button>
        </div>
      </div>

      <div v-show="showErrorToast" class="toast align-items-center text-white bg-danger border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">Connexion échouée. Veuillez réessayer.</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="showErrorToast = false"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AuthService } from '../Services/AuthService'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'loginSuccess', 'openInscription', 'forgotPassword'])

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const message = ref('')
const showSuccessToast = ref(false)
const showErrorToast = ref(false)

async function login() {
  if (!username.value || !password.value) {
    message.value = ''
    showErrorToast.value = true
    return
  }

  try {
    isLoading.value = true

    console.log('🔄 Tentative de connexion...')
    console.log('👤 Username:', username.value)
    console.log('🔑 Mot de passe:', password.value ? '***' : 'vide')

    // Utiliser le vrai AuthService pour la connexion
    const credentials = {
      username: username.value,
      password: password.value
    }

    console.log('📤 Envoi des credentials:', credentials)

    const response = await AuthService.login(credentials)

    // La connexion est automatiquement gérée par AuthService via le store
    console.log('✅ Connexion réussie:', response)

    message.value = 'Connexion réussie !'
    showSuccessToast.value = true
    emit('loginSuccess')

    // Fermer le modal après un délai pour montrer le feedback
    setTimeout(() => emit('close'), 500)
  } catch (error: unknown) {
    console.error('❌ Erreur de connexion:', error)
    if (error && typeof error === 'object' && 'message' in error) {
      console.error('🔍 Détails de l\'erreur:', {
        name: (error as Record<string, unknown>).name,
        message: (error as Record<string, unknown>).message,
        status: (error as Record<string, unknown>).status,
        stack: (error as Record<string, unknown>).stack
      })
    }
    message.value = ''
    showErrorToast.value = true
  } finally {
    isLoading.value = false
  }
}

function onClose() {
  emit('close')
}

function onOpenInscription() {
  emit('openInscription')
}

function onForgotPassword() {
  emit('forgotPassword')
}
</script>

<style scoped>
/* Forcer les textes en noir et supprimer toute transparence héritée */
.modal-content,
.modal-content .modal-body,
.modal-content .modal-item,
.modal-content .text-center,
.modal-content .col,
.modal-content label,
.modal-content p,
.modal-content h1,
.modal-content h2,
.modal-content h3,
.modal-content h4,
.modal-content h5,
.modal-content h6,
.modal-content a,
.modal-content span {
  color: #000 !important;
  opacity: 1 !important;
}

/* Inputs */
.form-control {
  color: #000 !important;
}

.form-control::placeholder {
  color: #6c757d !important;
  /* gris lisible */
  opacity: 1 !important;
  /* pas de transparence du placeholder */
}

/* Garder les boutons en blanc sur fond bleu comme dans l'original */
.btn.btn-custom {
  color: #fff !important;
}

/* Eye toggle button */
.btn-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 6px;
  color: #6c757d;
}
.btn-eye:focus { outline: none; }
</style>
