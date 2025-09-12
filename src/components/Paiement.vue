<template>
  <div v-if="visible">
    <div v-if="!showInfo" class="modal fade show" id="payer" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
         aria-labelledby="payerLabel" aria-hidden="true" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-body">
            <div>
              <div>
                <div class="d-flex justify-content-center">
                  <img src="/assets/Fichier 12.svg" width="150" height="80" alt="" />
                </div>
                <div class="d-flex justify-content-center">
                  <h5 class="mb-0">Informations de paiement</h5>
                </div>
                <hr />
              </div>

              <div class="d-flex justify-content-center mt-4 gap-3 flex-wrap">
                <label class="image-radio">
                  <input type="radio" name="imageSelect" value="AM" v-model="method" hidden />
                  <div class="image-container selectable" :class="{ selected: method==='AM' }">
                    <span class="badge bg-light text-dark px-3 py-2">Airtel Money</span>
                  </div>
                </label>

                <label class="image-radio">
                  <input type="radio" name="imageSelect" value="MC" v-model="method" hidden />
                  <div class="image-container selectable" :class="{ selected: method==='MC' }">
                    <span class="badge bg-light text-dark px-3 py-2">Mobi Cash</span>
                  </div>
                </label>
              </div>

              <div class="mt-4">
                <div class="d-flex justify-content-center">
                  <p class="mb-2">Veuillez entrer le numéro pour le paiement</p>
                </div>
                <div class="d-flex justify-content-center col-md-6 mx-auto">
                  <input class="form-control" type="tel" v-model="phone" placeholder="Ex: 0700000000" />
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-center my-4 gap-2">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
            <button type="button" class="btn btn-primary" :disabled="!canValidate" @click="validate">Valider</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!showInfo" class="modal-backdrop fade show"></div>

    <!-- Popup d'information pour Mobile Money -->
    <div v-if="showInfo" class="modal fade show" id="mmInfo" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
         aria-labelledby="mmInfoLabel" aria-hidden="true" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="mmInfoLabel">Information</h5>
          </div>
          <div class="modal-body">
            <p class="mb-0 text-center">Veillez saisir le mot de passe mobile money sur votre téléphone</p>
          </div>
          <div class="modal-footer d-flex justify-content-center">
            <button type="button" class="btn btn-primary" @click="showInfo=false">Ok compris</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showInfo" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{ visible: boolean; offer?: any }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'validate', payload: { method: string; phone: string; offer?: any }): void
}>()

const method = ref<'AM' | 'MC' | ''>('')
const phone = ref('')
const showInfo = ref(false)

const canValidate = computed(() => !!method.value && phone.value.trim().length >= 8)

function validate() {
  if (!canValidate.value) return
  // Afficher le popup d'information et lancer le paiement
  showInfo.value = true
  emit('validate', { method: method.value, phone: phone.value.trim(), offer: props.offer })
}

watchEffect(() => {
  if (!props.visible) {
    method.value = ''
    phone.value = ''
    showInfo.value = false
  }
})
</script>

<style scoped>
.selectable { cursor: pointer; border: 2px solid transparent; border-radius: 12px; padding: 8px 12px; }
.selectable.selected { border-color: #0F7ABB; box-shadow: 0 0 0 3px rgba(15,122,187,0.15); }
</style>
