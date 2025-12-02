<template>
  <div v-if="visible">
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
                <img class="img-fluid" src="/assets/Fichier 12.svg" alt="logo_ttm" width="160" height="80">
              </div>
              <div class="text-center" style="display: inline-block;">
                <h3 class="text-dark" style="display: inline-block; font-family: sans-serif;">Mot de passe oublié ?</h3>
                <p class="text-muted" style="font-size: 14px; margin-top: 10px;">
                  Entrez votre email et nous vous enverrons un lien pour choisir un nouveau mot de passe.
                </p>
              </div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <form class="col-md-8 pe-0 ps-0" @submit.prevent>
                <div class="mb-3">
                  <label for="email" class="form-label mb-1 text-dark"
                         style="font-size: 16px; font-weight: 600; font-family: sans-serif;">Adresse email*</label>
                  <input id="email" type="email" class="form-control" style="border-radius: 15px;"
                         placeholder="Entrez votre adresse email" v-model="email">
                </div>

                <div class="text-center mt-4">
                  <button type="button" class="btn btn-secondary me-2" style="border-radius: 12px;" @click="onClose" :disabled="isLoading">Annuler</button>
                  <button type="button" class="btn btn-primary" style="border-radius: 12px; background-color: #0F7ABB;"
                          :disabled="!canSubmit || isLoading" @click="onSubmit">
                    {{ isLoading ? 'Envoi...' : 'Envoyer le lien' }}
                  </button>
                </div>

                <div class="mt-3 text-center">
                  <small v-if="successMessage" class="text-success">{{ successMessage }}</small>
                  <small v-if="errorMessage" class="text-danger">{{ errorMessage }}</small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AuthService } from '../Services/AuthService'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const email = ref('')
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const canSubmit = computed(() => /.+@.+\..+/.test(email.value.trim()))

function onClose() {
  if (!isLoading.value) emit('close')
}

async function onSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await AuthService.forgotPassword(email.value.trim())
    successMessage.value = 'Un lien de réinitialisation a été envoyé à votre email. Vérifiez votre boîte de réception.'
    // fermer après un court délai
    setTimeout(() => emit('close'), 2500)
  } catch (e) {
    errorMessage.value = "Échec de l'envoi. Veuillez réessayer."
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
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

.form-control {
  color: #000 !important;
}

.form-control::placeholder {
  color: #6c757d !important;
  opacity: 1 !important;
}

.btn-eye:focus { outline: none; }
</style>
