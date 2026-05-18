<template>
  <div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="success" class="alert alert-success">Paiement réussi — crédits mis à jour.</div>

    <div v-if="pending" class="alert alert-warning">Paiement en attente... (vérification automatique)</div>

    <form @submit.prevent="onPay">
      <div class="mb-2">
        <label>Téléphone</label>
        <input v-model="phone" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Montant</label>
        <input v-model.number="amount" type="number" class="form-control" />
      </div>
      <button class="btn btn-primary" :disabled="loading">Payer</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MyPayGaService } from '@/Services/MyPayGaService'
import { useCreditStore } from '@/stores/credit'

const phone = ref('')
const amount = ref<number>(0)
const loading = ref(false)
const pending = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

let pollId: any = null
const creditStore = useCreditStore()

async function onPay() {
  loading.value = true
  error.value = null
  success.value = false

  try {
    const baseline = creditStore.credits
    const res = await MyPayGaService.subscribePricing({
      phone: phone.value,
      amount: amount.value,
      email: 'demo@example.com',
      network: 'airtel',
    })

    if (Number(res.request_status) !== 200) {
      throw new Error(res.message || 'Échec du paiement')
    }

    pending.value = true

    const started = Date.now()
    pollId = setInterval(async () => {
      try {
        await creditStore.refreshForCurrentUser()
        if (creditStore.credits > baseline) {
          clearInterval(pollId)
          pending.value = false
          success.value = true
        } else if (Date.now() - started > 2 * 60 * 1000) {
          clearInterval(pollId)
          pending.value = false
          error.value = 'Timeout de la vérification. Réessayez plus tard.'
        }
      } catch (e: any) {
        clearInterval(pollId)
        pending.value = false
        error.value = e?.message || 'Erreur lors de la vérification du paiement.'
      }
    }, 2000)

  } catch (e: any) {
    error.value = e?.message || 'Erreur lors de l\'initialisation du paiement.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.alert { margin-top: 1rem }
</style>
