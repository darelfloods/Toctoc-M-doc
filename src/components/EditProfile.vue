<template>
  <div v-if="visible">
    <div class="modal fade show" style="display:block;" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content p-3">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="modal-title">Modifier mon profil</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="onClose" />
          </div>
          <div class="modal-body">
            <div class="text-center mb-3">
              <img src="/assets/Fichier 12.svg" alt="logo" width="120" height="70" />
            </div>
            <form @submit.prevent="onSubmit">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Pseudo</label>
                  <input type="text" class="form-control" v-model="form.pseudo" placeholder="Votre pseudo" />
                </div>
                <div class="col-12">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="form.email" placeholder="email@exemple.com" required />
                </div>
                <div class="col-12">
                  <label class="form-label">Téléphone</label>
                  <input type="text" class="form-control" v-model="form.phone" placeholder="Ex: +241..." />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" @click="onClose" :disabled="isLoading">Annuler</button>
                <button type="submit" class="btn btn-primary" style="background-color:#0F7ABB;" :disabled="!canSubmit || isLoading">
                  {{ isLoading ? 'Mise à jour...' : 'Enregistrer' }}
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AuthService } from '@/Services/AuthService'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const authStore = useAuthStore()

const form = reactive<{ pseudo: string; email: string; phone: string }>({
  pseudo: '',
  email: '',
  phone: '',
})

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(() => {
  const u: any = authStore.currentUser || getStoredUser()
  if (u) {
    // Pré-remplir le pseudo à partir des diverses sources possibles
    const first = u.firstname || u.first_name || u.prenom || u.firstName || ''
    const last = u.lastname || u.last_name || u.nom || u.lastName || ''
    form.pseudo = u.pseudo || u.username || u.name || u.login || u.identifiant || `${first}${first && last ? ' ' : ''}${last}` || ''
    form.email = u.email || ''
    form.phone = u.phone || u.telephone || u.tel || ''
  }
})

function getStoredUser(): any | null {
  try {
    const a = localStorage.getItem('auth_user')
    if (a) return JSON.parse(a)
  } catch {}
  try {
    const b = localStorage.getItem('user_connected')
    if (b) return JSON.parse(b)
  } catch {}
  return null
}

const canSubmit = computed(() => /.+@.+\..+/.test((form.email || '').trim()))

function onClose() {
  if (!isLoading.value) emit('close')
}

async function onSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const current: any = authStore.currentUser || getStoredUser()
    if (!current?.id) throw new Error('Utilisateur non connecté')
    const payload: Record<string, any> = {
      pseudo: form.pseudo,
      email: form.email,
      phone: form.phone,
    }
    await AuthService.updateProfile(current.id, payload)
    successMessage.value = 'Profil mis à jour avec succès.'
    setTimeout(() => { emit('updated'); emit('close') }, 900)
  } catch (e: any) {
    errorMessage.value = e?.message || 'Échec de la mise à jour du profil'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-content { border-radius: 16px; }
</style>
