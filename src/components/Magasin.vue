<template>
  <div v-if="visible">
    <div v-if="!showPayment" class="modal fade show" id="magasin" tabindex="-1" aria-labelledby="magasinLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content custom-modal-content">
          <div class="modal-header border-0 magasin-header">
            <div class="magasin-title-block">
              <div class="magasin-icon">
                <i class="bi bi-coin"></i>
              </div>
              <div>
                <h1 class="modal-title" id="magasinLabel">Magasin de crédits</h1>
                <p class="magasin-subtitle">
                  Choisissez une offre, payez par Mobile Money et vos crédits sont automatiquement ajoutés à votre compte.
                </p>
              </div>
            </div>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
          </div>

          <div class="modal-body magasin-body">
            <div class="grid-container">
              <div
                class="credit-card"
                v-for="offer in offers"
                :key="offer.id"
                :class="{ popular: offer.popular }"
              >
                <div v-if="offer.badge" class="value-indicator">
                  <i :class="offer.badge.icon + ' me-1'"></i>
                  {{ offer.badge.text }}
                </div>
                <div v-if="offer.popular" class="popular-badge">
                  <i class="fas fa-star me-1"></i>
                  Populaire
                </div>
                <div class="text-center">
                  <div class="credit-amount">
                    <img :src="offer.img" width="64" height="64" alt="" />
                  </div>
                  <h5 class="offer-title">{{ offer.title }}</h5>

                  <div class="credits-line">
                    <span class="credits-value">
                      {{ getCreditsForOffer(offer) }}
                    </span>
                    <span class="credits-unit">crédits</span>
                  </div>

                  <div class="price-line">
                    <span class="price">{{ offer.price }}</span>
                  </div>

                  <button class="buy-btn" @click="openConfirm(offer)">
                    <i class="bi bi-cart-check me-2"></i>
                    Acheter cette offre
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer border-0 magasin-footer">
            <button type="button" class="btn btn-outline-secondary footer-btn" @click="$emit('close')">
              <i class="bi bi-x me-2"></i>
              Fermer
            </button>
            <button type="button" class="btn btn-primary footer-btn">
              <i class="bi bi-info-circle me-2"></i>
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
import { ref, onMounted } from 'vue'
import Paiement from './Paiement.vue'
import { MyPayGaService } from '@/Services/MyPayGaService'
import { useAuthStore } from '@/stores/auth'
import { CreditService } from '@/Services/CreditService'
import { useCreditStore } from '@/stores/credit'
import { HttpService } from '@/Services/HttpService'

interface Offer {
  id: number
  libelle: string
  title: string
  price: string
  img: string
  popular?: boolean
  badge?: { icon: string; text: string }
}

interface Rate {
  id: number
  libelle: string
  price: number
  credit: number
}

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close','purchased'])

// Ajout du libelle (clé produit) attendu par l'API pour résoudre le bon rate_id côté backend
// 🎯 Toutes les offres sont maintenant affichées et synchronisées avec les tarifs backend
const offers: Offer[] = [
  { id: 1, libelle: 'starter', title: 'Offre Starter', price: '100 F CFA', img: '/assets/offre3.png' },
  { id: 2, libelle: 'basic', title: 'Offre Basic', price: '500 F CFA', img: '/assets/offre2.png' },
  { id: 3, libelle: 'standard', title: 'Offre Standard', price: '1000 F CFA', img: '/assets/offre3.png', popular: true },
  { id: 4, libelle: 'premium', title: 'Offre Premium', price: '2500 F CFA', img: '/assets/offre4.png', badge: { icon: 'fas fa-percentage', text: 'Économie' } },
  { id: 5, libelle: 'pro', title: 'Offre Pro', price: '5000 F CFA', img: '/assets/offre5.png', badge: { icon: 'fas fa-fire', text: 'Top Deal' } },
  { id: 6, libelle: 'elite', title: 'Offre Elite', price: '7500 F CFA', img: '/assets/offre6.png', badge: { icon: 'fas fa-crown', text: 'VIP' } },
]

const showConfirm = ref(false)
const showPayment = ref(false)
const selectedOffer = ref<any | null>(null)
const auth = useAuthStore()
const creditStore = useCreditStore()
const rates = ref<Rate[]>([])

onMounted(async () => {
  try {
    console.log('📡 [MAGASIN] Chargement des tarifs depuis le backend (/rate/all)...')
    const res = await HttpService.get<Rate[]>('/rate/all')
    rates.value = res.data || []

    // Synchroniser les offres front avec les tarifs backend (id + prix)
    offers.forEach((of) => {
      const rate = rates.value.find(
        (r) => r.libelle.toLowerCase() === String(of.libelle || '').toLowerCase()
      )
      if (rate) {
        of.id = rate.id
        of.price = `${rate.price} F CFA`
      }
    })

    console.log('✅ [MAGASIN] Tarifs backend chargés:', rates.value)
  } catch (e) {
    console.error('❌ [MAGASIN] Erreur lors du chargement des tarifs backend:', e)
  }
})

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
  // 🎯 NOUVELLE LOGIQUE : s'aligner sur le backend
  // On récupère le tarif directement depuis /rate/all (RateModel) et on utilise Rate.credit

  if (!rates.value.length) {
    console.warn('⚠️ [MAGASIN] Aucun tarif chargé, tentative de résolution impossible')
    return { rate_id: 0, creditAmount: 0 }
  }

  const libelle: string | undefined = of?.libelle

  // On essaie d'abord par id (si déjà synchronisé), puis par libellé
  let rate = rates.value.find((r) => r.id === of.id)
  if (!rate && libelle) {
    rate = rates.value.find(
      (r) => r.libelle.toLowerCase() === String(libelle).toLowerCase()
    )
  }

  if (!rate) {
    console.warn('⚠️ [MAGASIN] Aucun tarif backend correspondant pour cette offre:', of)
    return { rate_id: 0, creditAmount: 0 }
  }

  const rate_id = rate.id
  const creditAmount = rate.credit

  console.log('💰 [PRICING] RÉSOLUTION VIA BACKEND:')
  console.log('  - Libellé (API):', rate.libelle)
  console.log('  - Prix (API):', rate.price)
  console.log('  - Crédits (API):', creditAmount)
  console.log('  - Rate ID:', rate_id)

  return { rate_id, creditAmount }
}

function getCreditsForOffer(of: Offer): string {
  // 🔒 Affichage volontairement neutre pour les crédits
  // On masque la valeur exacte et on affiche simplement "--"
  return '—'
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
.magasin-header {
  padding: 24px 32px 8px;
}

.magasin-title-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.magasin-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0F7ABB 0%, #3AB24F 100%);
  color: #fff;
  font-size: 22px;
}

.magasin-title-block h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.magasin-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.magasin-body {
  padding: 8px 24px 24px;
  background: radial-gradient(circle at top left, rgba(15, 122, 187, 0.07), transparent 55%),
              radial-gradient(circle at bottom right, rgba(58, 178, 79, 0.07), transparent 55%);
}

.offers-helper-text {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  padding: 0 8px;
}

.offers-helper-text > span:first-child {
  font-weight: 600;
  font-size: 14px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding: 8px 4px 4px;
  min-height: 260px;
}

.credit-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px 16px 18px;
  position: relative;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.credit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  border-color: rgba(37, 99, 235, 0.55);
}

.credit-amount {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.offer-title {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #111827;
}

.credits-line {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 6px;
}

.credits-value {
  font-size: 18px;
  font-weight: 700;
  color: #0F7ABB;
}

.credits-unit {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.price-line {
  margin-bottom: 10px;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.buy-btn {
  background: linear-gradient(135deg, #0F7ABB 0%, #3AB24F 100%);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 9px 16px;
  font-weight: 600;
  font-size: 13px;
  margin-top: 4px;
  box-shadow: 0 8px 18px rgba(15, 122, 187, 0.28);
}

.buy-btn:hover {
  opacity: 0.95;
}

.value-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(58,178,79,0.08);
  color: #059669;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.popular-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #F59E0B;
  color: #fff;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 5px 15px rgba(245,158,11,0.4);
}
@media (max-width: 992px) {
  .magasin-body {
    padding-inline: 16px;
  }
}
@media (max-width: 576px) {
  .magasin-header {
    padding: 20px 16px 6px;
  }

  .grid-container { padding: 4px 0 8px; min-height: 150px; }
}
</style>
