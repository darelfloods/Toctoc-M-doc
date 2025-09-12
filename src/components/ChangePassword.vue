<template>
  <div v-if="visible">
    <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content p-3">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="modal-title">Réinitialiser mot de passe</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="onClose" />
          </div>
          <div class="modal-body">
            <div class="text-center mb-3">
              <img src="/assets/Fichier 12.svg" alt="logo" width="120" height="70" />
            </div>
            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label">Nouveau mot de passe</label>
                <input type="password" class="form-control" v-model="password" placeholder="Nouveau mot de passe" required />
              </div>
              <div class="mb-2">
                <label class="form-label">Confirmez le mot de passe</label>
                <input type="password" class="form-control" v-model="confirm" placeholder="Confirmez le mot de passe" required />
              </div>
              <div class="mb-3">
                <small v-if="passwordsMismatch" class="text-danger">Les mots de passe ne sont pas identiques.</small>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-2">
                <button type="button" class="btn btn-secondary" @click="onClose" :disabled="isLoading">Fermer</button>
                <button type="submit" class="btn btn-primary" style="background-color:#0F7ABB;" :disabled="!canSubmit || isLoading">
                  {{ isLoading ? 'Mise à jour...' : 'Réinitialiser' }}
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
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AuthService } from '@/Services/AuthService'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const password = ref('')
const confirm = ref('')
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const passwordsMismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value)
const canSubmit = computed(() => password.value.length >= 4 && confirm.value.length >= 4 && !passwordsMismatch.value)

function onClose() {
  if (!isLoading.value) emit('close')
}

async function onSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const authStore = useAuthStore()
    const current = authStore.currentUser
    if (!current?.id) {
      throw new Error('Utilisateur non connecté')
    }
    await AuthService.updatePassword(current.id, password.value)
    successMessage.value = 'Mot de passe mis à jour avec succès.'
    // notifier le parent pour rafraîchir si besoin
    setTimeout(() => {
      emit('updated')
      emit('close')
    }, 900)
  } catch (e: any) {
    errorMessage.value = e?.message || "Échec de la mise à jour du mot de passe"
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-content {
  border-radius: 16px;
}
</style>
