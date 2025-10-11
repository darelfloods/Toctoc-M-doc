<template>
  <div v-if="visible">
    <div v-if="!showPayment" class="modal fade show" id="magasin" tabindex="-1" aria-labelledby="magasinLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content custom-modal-content">
          <div class="modal-header border-0">
            <h1 class="modal-title d-flex align-items-center" id="magasinLabel">
              <i class="fas fa-coins me-3" style="color: var(--accent-color);"></i>
              Magasin de Crédits
            </h1>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
          </div>

          <div class="modal-body p-0">
            <div class="grid-container">
              <div class="credit-card" v-for="offer in offers" :key="offer.id" :class="{ popular: offer.popular }">
                <div v-if="offer.badge" class="value-indicator">
                  <i :class="offer.badge.icon + ' me-1'"></i>
                  {{ offer.badge.text }}
                </div>
                <div v-if="offer.popular" class="popular-badge">
                  <i class="fas fa-star me-1"></i>
                  Populaire
                </div>
                <div class="text-center">
                  <h5 class="mb-3 fw-bold text-uppercase">{{ offer.title }}</h5>
                  <div class="mb-3">
                    <div class="credit-amount">
                      <img :src="offer.img" width="60" height="60" alt="" />
                    </div>
                    <div class="credit-label">Crédits</div>
                  </div>
                  <div class="price">{{ offer.price }}</div>
                  <button class="buy-btn" @click="openConfirm(offer)">
                    <i class="fas fa-shopping-cart me-2"></i>
                    Acheter
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer border-0">
            <button type="button" class="btn btn-outline-secondary footer-btn" @click="$emit('close')">
              <i class="fas fa-times me-2"></i>
              Fermer
            </button>
            <button type="button" class="btn btn-primary footer-btn">
              <i class="fas fa-info-circle me-2"></i>
              Aide
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!showPayment" class="modal-backdrop fade show"></div>

    <!-- Petit modal de confirmation d'achat -->
    <div v-if="showConfirm && !showPayment" class="modal fade show" id="achat" tabindex="-1" aria-labelledby="achatLabel" aria-hidden="true" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="achatLabel">Confirmer l'achat</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="showConfirm=false"></button>
          </div>
          <div class="modal-body">
            <p>Voulez-vous confirmer l'achat de l'offre <strong>{{ selectedOffer?.title }}</strong> à <strong>{{ selectedOffer?.price }}</strong> ?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showConfirm=false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="confirmPurchase">Confirmer</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showConfirm && !showPayment" class="modal-backdrop fade show"></div>

    <!-- Modal de paiement -->
    <Paiement v-if="showPayment" :visible="showPayment" :offer="selectedOffer" @close="showPayment=false" @validate="onPaymentValidate" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Paiement from './Paiement.vue'
import { MyPayGaService } from '@/Services/MyPayGaService'
import { useAuthStore } from '@/stores/auth'
import { CreditService } from '@/Services/CreditService'
import { useCreditStore } from '@/stores/credit'

interface Offer {
  id: number
  libelle: string
  title: string
  price: string
  img: string
  popular?: boolean
  badge?: { icon: string; text: string }
}

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close','purchased'])

// Ajout du libelle (clé produit) attendu par l'API pour résoudre le bon rate_id côté backend
// 🎯 SEULEMENT L'OFFRE 100F AVEC L'IMAGE DES 20 CRÉDITS
const offers: Offer[] = [
  { id: 1, libelle: 'starter', title: 'Offre Starter', price: '100 F CFA', img: '/assets/offre3.png' },
  // Autres offres masquées temporairement
  // { id: 2, libelle: 'basic', title: 'Offre Basic', price: '500 F CFA', img: '/assets/offre2.png' },
  // { id: 3, libelle: 'standard', title: 'Offre Standard', price: '1000 F CFA', img: '/assets/offre3.png', popular: true },
  // { id: 4, libelle: 'premium', title: 'Offre Premium', price: '2500 F CFA', img: '/assets/offre4.png', badge: { icon: 'fas fa-percentage', text: 'Économie' } },
  // { id: 5, libelle: 'pro', title: 'Offre Pro', price: '5000 F CFA', img: '/assets/offre5.png', badge: { icon: 'fas fa-fire', text: 'Top Deal' } },
  // { id: 6, libelle: 'elite', title: 'Offre Elite', price: '7500 F CFA', img: '/assets/offre6.png', badge: { icon: 'fas fa-crown', text: 'VIP' } },
]

const showConfirm = ref(false)
const showPayment = ref(false)
const selectedOffer = ref<any | null>(null)
const auth = useAuthStore()
const creditStore = useCreditStore()

function openConfirm(offer: any) {
  selectedOffer.value = offer
  showConfirm.value = true
}

function confirmPurchase() {
  // close confirm modal and open payment modal
  showConfirm.value = false
  showPayment.value = true
}

function parseAmount(p: any): number {
  const s = String(p || '').replace(/[^0-9]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

async function resolvePricing(of: any): Promise<{ rate_id: number; creditAmount: number }> {
  // 🎯 TABLE DE CORRESPONDANCE DÉFINITIVE PRIX → CRÉDITS
  // Basée sur les vrais forfaits du système
  const creditsByPrice: Record<number, number> = {
    100: 2,      // 100 F CFA → 2 crédits
    500: 10,     // 500 F CFA → 10 crédits  
    1000: 20,    // 1000 F CFA → 20 crédits
    2500: 50,    // 2500 F CFA → 50 crédits
    5000: 100,   // 5000 F CFA → 100 crédits
    7500: 200,   // 7500 F CFA → 200 crédits
  }
  
  // Fallback par libellé (garde pour compatibilité)
  const fallbackByLibelle: Record<string, number> = {
    starter: 2,
    basic: 10,
    standard: 20,
    premium: 50,
    pro: 100,
    elite: 200,
  }
  
  const libelle: string | undefined = of?.libelle
  const prix = parseAmount(of?.price) || 0
  let rate_id = Number(of?.id) || 0 // Garder le rate_id original pour MyPayGA
  
  // 🎯 PRIORITÉ 1: Correspondance par prix (le plus fiable)
  let creditAmount = creditsByPrice[prix] || 0
  
  // 🎯 PRIORITÉ 2: Fallback par libellé si pas de correspondance prix
  if (creditAmount === 0 && libelle) {
    creditAmount = fallbackByLibelle[libelle] || 0
  }
  
  console.log('💰 [PRICING] RÉSOLUTION FINALE:')
  console.log('  - Prix:', prix, 'F CFA')
  console.log('  - Libellé:', libelle)
  console.log('  - Crédits attribués:', creditAmount)
  console.log('  - Rate ID:', rate_id)
  
  // 🚫 IGNORER COMPLÈTEMENT L'API DÉFAILLANTE
  // L'API renvoie des valeurs incorrectes, on utilise nos valeurs hardcodées
  
  return { rate_id, creditAmount }
}

async function onPaymentValidate(payload: { method: string; phone: string; offer?: any }) {
  try {
    const offer = payload.offer || selectedOffer.value
    const amount = parseAmount(offer?.price)
    // Récupérer rate_id et le nombre de crédits à créditer
    const { rate_id, creditAmount } = await resolvePricing(offer)

    // DEBUG: Log des valeurs pour comprendre le problème
    console.log('🔍 [MAGASIN] Debug recharge crédits:')
    console.log('  - Offre:', offer)
    console.log('  - Montant:', amount)
    console.log('  - Rate ID:', rate_id)
    console.log('  - Crédits à ajouter:', creditAmount)
    console.log('  - Téléphone:', payload.phone)
    console.log('  - Méthode:', payload.method)

    const user = auth.currentUser
    console.log('📞 [MAGASIN] Appel API MyPayGa...')

    const paymentResult = await MyPayGaService.subscribePricing({
      phone: payload.phone,
      amount,
      lastname: user?.name || 'Client',
      email: user?.email || '',
      rate_id,
      network: payload.method
      // Le backend va gérer automatiquement l'ajout des crédits via le callback
    })

    console.log('📦 [MAGASIN] Réponse MyPayGa:', paymentResult)
    console.log('📦 [MAGASIN] request_status:', paymentResult.request_status)
    console.log('📦 [MAGASIN] request_status TYPE:', typeof paymentResult.request_status)
    console.log('📦 [MAGASIN] message:', paymentResult.message)

    // Vérifier si la requête de paiement a été envoyée avec succès
    // request_status === 0 : Demande envoyée, attente de confirmation
    // request_status === 200 : Paiement confirmé immédiatement
    // IMPORTANT: Convertir en nombre car l'API peut renvoyer une string "0"
    const status = Number(paymentResult.request_status)
    const requestSent = status === 0 || status === 200

    console.log('✨ [MAGASIN] Status converti en nombre:', status)
    console.log('✨ [MAGASIN] requestSent:', requestSent)

    if (!requestSent) {
      console.error('❌❌❌ [MAGASIN] CETTE ALERTE VIENT D\'ICI - Ligne 230 ❌❌❌')
      console.error('❌ [MAGASIN] Échec de l\'envoi de la demande:', paymentResult.message)
      alert(`Erreur de paiement: ${paymentResult.message || 'Échec du paiement'}`)
      return
    }

    console.log('✅✅✅ [MAGASIN] La requête a été envoyée avec succès! ✅✅✅')

    // Pour TOUS les statuts (0 ou 200), le backend gère l'ajout des crédits automatiquement via le callback
    // On informe l'utilisateur et on lui permet de rafraîchir ses crédits après validation
    console.log('📲 [MAGASIN] Demande de paiement envoyée, en attente de confirmation sur téléphone')

    const confirmed = confirm(
      `📲 Demande de paiement envoyée !\n\n` +
      `Vous allez recevoir un SMS/notification sur votre téléphone (${payload.phone}) pour confirmer le paiement avec votre code PIN Mobile Money.\n\n` +
      `Composez le code affiché sur votre téléphone pour valider le paiement.\n\n` +
      `Cliquez sur OK après avoir validé le paiement pour voir vos crédits mis à jour.`
    )

    if (confirmed) {
      // Rafraîchir les crédits pour voir si le paiement a été confirmé par le backend
      console.log('🔄 [MAGASIN] Rafraîchissement des crédits...')
      await creditStore.refreshForCurrentUser()
      console.log('💰 [MAGASIN] Crédits actuels après rafraîchissement:', creditStore.credits)
      alert(`✅ Crédits mis à jour ! Vous avez maintenant ${creditStore.credits} crédits.`)
    }

    return
  } catch (e: any) {
    console.error('❌ [MAGASIN] Erreur MyPayGA:', e)
    const errorMessage = e?.message || e?.data?.message || e?.data || 'Erreur inconnue'
    alert(`Erreur lors du paiement: ${errorMessage}\n\nVeuillez vérifier:\n- Votre numéro de téléphone\n- Votre solde Mobile Money\n- Votre connexion internet`)
  } finally {
    emit('purchased', payload)
    showPayment.value = false
  }
}
</script>

<style scoped>
.custom-modal-content { background: rgba(255,255,255,0.98); border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden; }
.grid-container { display: flex; justify-content: center; align-items: center; gap: 20px; padding: 24px; min-height: 300px; }
/* Pour plusieurs offres, utiliser grid */
.grid-container.multiple-offers { display: grid; grid-template-columns: repeat(3, 1fr); justify-items: center; }
.credit-card { background: #fff; border-radius: 16px; padding: 24px; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.08); transition: transform .2s, box-shadow .2s; }
.credit-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
.credit-amount { display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
.credit-label { color: #718096; font-size: 12px; }
.price { font-size: 20px; font-weight: 700; color: #2d3748; margin: 12px 0 16px; }
.buy-btn { background: linear-gradient(135deg, #0F7ABB 0%, #3AB24F 100%); color: #fff; border: none; border-radius: 10px; padding: 10px 16px; font-weight: 600; }
.value-indicator { position: absolute; top: 10px; left: 10px; background: rgba(58,178,79,0.1); color: #059669; padding: 6px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.popular-badge { position: absolute; top: 10px; right: 10px; background: #F59E0B; color: #fff; padding: 6px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; box-shadow: 0 5px 15px rgba(245,158,11,0.4); }

@media (max-width: 992px) {
  .grid-container { flex-direction: column; min-height: 200px; }
  .grid-container.multiple-offers { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 576px) {
  .grid-container { padding: 16px; min-height: 150px; }
  .grid-container.multiple-offers { grid-template-columns: 1fr; }
}
</style>
