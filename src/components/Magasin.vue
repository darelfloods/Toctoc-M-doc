<template>
  <div v-if="visible">
    <div v-if="!showPayment" class="modal fade show" id="magasin" tabindex="-1" aria-labelledby="magasinLabel" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
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
            <!-- Message de chargement -->
            <div v-if="isLoading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <p class="mt-3">Chargement des offres...</p>
            </div>
            
            <!-- Message si aucune offre -->
            <div v-else-if="offers.length === 0" class="text-center py-5">
              <i class="bi bi-inbox" style="font-size: 48px; color: #6b7280;"></i>
              <p class="mt-3 text-muted">Aucune offre disponible pour le moment.</p>
            </div>
            
            <!-- Grille des offres -->
            <div v-else class="grid-container">
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

    <!-- Modal de succès du paiement -->
    <div v-if="showPaymentSuccess" class="modal fade show" id="paymentSuccess" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center p-4">
          <div class="modal-body">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 64px;"></i>
            <h4 class="mt-3">Paiement réussi !</h4>
            <p class="text-muted">Vos crédits ont été ajoutés à votre compte.</p>
            <p class="fw-bold">Nouveaux crédits : {{ creditStore.credits }}</p>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-primary" @click="closeAllModals">Fermer</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPaymentSuccess" class="modal-backdrop fade show"></div>

    <!-- Modal de paiement en attente -->
    <div v-if="showPaymentPending" class="modal fade show" id="paymentPending" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center p-4">
          <div class="modal-body">
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <h4 class="mt-3">Paiement en cours...</h4>
            <p class="text-muted">Veuillez confirmer le paiement sur votre téléphone {{ pendingPaymentPhone }}</p>
            <p class="text-muted small">Vous allez recevoir un message de votre opérateur Mobile Money</p>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-outline-secondary" @click="showPaymentPending=false">Annuler</button>
            <button type="button" class="btn btn-primary" @click="checkPendingPayment">
              <i class="bi bi-arrow-clockwise me-2"></i>
              Vérifier le statut
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPaymentPending" class="modal-backdrop fade show"></div>

    <!-- Modal d'erreur de paiement -->
    <div v-if="showPaymentError" class="modal fade show" id="paymentError" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center p-4">
          <div class="modal-body">
            <i class="bi bi-x-circle-fill text-danger" style="font-size: 64px;"></i>
            <h4 class="mt-3">Échec du paiement</h4>
            <p class="text-muted" style="white-space: pre-line;">{{ paymentErrorMessage }}</p>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-secondary" @click="showPaymentError=false">Fermer</button>
            <button type="button" class="btn btn-primary" @click="showPaymentError=false; showPayment=true">Réessayer</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPaymentError" class="modal-backdrop fade show"></div>
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

const showConfirm = ref(false)
const showPayment = ref(false)
const selectedOffer = ref<any | null>(null)
const auth = useAuthStore()
const creditStore = useCreditStore()
const rates = ref<Rate[]>([])
const isLoading = ref(true)

// 🎯 SYSTÈME 100% DYNAMIQUE : Les offres sont générées automatiquement depuis l'API
// Plus besoin de définir les offres manuellement dans le code !
const offers = ref<Offer[]>([])

// Mapping des images par défaut selon le libellé (optionnel)
const defaultImages: Record<string, string> = {
  'starter': '/assets/offre1.png',
  'basic': '/assets/offre2.png',
  'standard': '/assets/offre3.png',
  'premium': '/assets/offre4.png',
  'pro': '/assets/offre5.png',
  'elite': '/assets/offre6.png',
}

// Fonction pour formater le titre à partir du libellé
function formatTitle(libelle: string): string {
  return `Offre ${libelle.charAt(0).toUpperCase() + libelle.slice(1)}`
}

// Fonction pour déterminer l'image à utiliser
function getImageForOffer(libelle: string, index: number): string {
  const normalizedLibelle = libelle.toLowerCase()
  // Utiliser l'image par défaut si elle existe, sinon utiliser une image cyclique
  return defaultImages[normalizedLibelle] || `/assets/offre${(index % 6) + 1}.png`
}

// Fonction pour déterminer si une offre est populaire (optionnel)
function isPopular(libelle: string, price: number): boolean {
  // Marquer comme populaire les offres "standard" ou celles entre 1000 et 3000 FCFA
  return libelle.toLowerCase() === 'standard' || (price >= 1000 && price <= 3000)
}

// Fonction pour déterminer le badge d'une offre (optionnel)
function getBadge(libelle: string, price: number): { icon: string; text: string } | undefined {
  const normalized = libelle.toLowerCase()
  
  if (normalized === 'premium' || price >= 2000) {
    return { icon: 'fas fa-percentage', text: 'Économie' }
  }
  if (normalized === 'pro' || price >= 4000) {
    return { icon: 'fas fa-fire', text: 'Top Deal' }
  }
  if (normalized === 'elite' || price >= 7000) {
    return { icon: 'fas fa-crown', text: 'VIP' }
  }
  
  return undefined
}

onMounted(async () => {
  isLoading.value = true
  try {
    console.log('📡 [MAGASIN] Chargement des tarifs depuis le backend (/rate/all)...')
    const res = await HttpService.get<Rate[]>('/rate/all')
    
    console.log('📦 [MAGASIN] Réponse brute de l\'API:', res)
    
    // Gérer différents formats de réponse
    const ratesData = res.data || res || []
    rates.value = Array.isArray(ratesData) ? ratesData : []
    
    console.log('📊 [MAGASIN] Tarifs extraits:', rates.value)

    if (rates.value.length === 0) {
      console.warn('⚠️ [MAGASIN] Aucun tarif reçu de l\'API')
    } else {
      // 🎯 GÉNÉRATION AUTOMATIQUE DES OFFRES depuis les tarifs backend
      offers.value = rates.value.map((rate, index) => ({
        id: rate.id,
        libelle: rate.libelle,
        title: formatTitle(rate.libelle),
        price: `${rate.price} F CFA`,
        img: getImageForOffer(rate.libelle, index),
        popular: isPopular(rate.libelle, rate.price),
        badge: getBadge(rate.libelle, rate.price)
      }))

      console.log('✅ [MAGASIN] Tarifs backend chargés:', rates.value)
      console.log('✅ [MAGASIN] Offres générées automatiquement:', offers.value)
    }
  } catch (e: any) {
    console.error('❌ [MAGASIN] Erreur lors du chargement des tarifs backend:', e)
    console.error('❌ [MAGASIN] Détails de l\'erreur:', e?.response || e?.message || e)
  } finally {
    isLoading.value = false
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

// 🔒 Fonction d'affichage des crédits pour une offre
// Affiche le nombre de crédits depuis les données backend
function getCreditsForOffer(of: Offer): string {
  const rate = rates.value.find(r => r.id === of.id)
  return rate ? rate.credit.toLocaleString() : '—'
}

// États pour les modales de statut de paiement
const showPaymentPending = ref(false)
const showPaymentSuccess = ref(false)
const showPaymentError = ref(false)
const paymentErrorMessage = ref('')
const pendingPaymentPhone = ref('')

async function onPaymentValidate(payload: { method: string; phone: string; offer?: any }) {
  try {
    const offer = payload.offer || selectedOffer.value
    const amount = parseAmount(offer?.price)

    // 🎯 VALIDATION: Vérifier que le montant est valide
    if (!amount || amount <= 0) {
      paymentErrorMessage.value = 'Montant invalide. Veuillez sélectionner une offre valide.'
      showPaymentError.value = true
      return
    }

    // 🎯 VALIDATION: Vérifier que le téléphone est renseigné
    if (!payload.phone || payload.phone.trim().length < 8) {
      paymentErrorMessage.value = 'Numéro de téléphone invalide. Veuillez saisir un numéro valide.'
      showPaymentError.value = true
      return
    }

    // Récupérer rate_id et le nombre de crédits à créditer
    const { rate_id, creditAmount } = await resolvePricing(offer)

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
    })

    console.log('📦 [MAGASIN] Réponse MyPayGa:', paymentResult)
    console.log('📦 [MAGASIN] request_status:', paymentResult.request_status)
    console.log('📦 [MAGASIN] message:', paymentResult.message)

    const status = Number(paymentResult.request_status)

    // 🎯 LOGIQUE CORRIGÉE: Vérifier que les crédits ont bien été ajoutés
    if (status === 200) {
      // ✅ Paiement confirmé immédiatement - mais on vérifie les crédits
      console.log('✅ [MAGASIN] Paiement confirmé par MyPayGa')
      showPayment.value = false
      
      // Sauvegarder les crédits avant paiement
      const creditsBefore = creditStore.credits
      console.log('💰 [MAGASIN] Crédits avant paiement:', creditsBefore)
      
      // Attendre un peu pour que le callback soit traité
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Rafraîchir les crédits
      await creditStore.refreshForCurrentUser()
      const creditsAfter = creditStore.credits
      console.log('💰 [MAGASIN] Crédits après paiement:', creditsAfter)
      
      // Vérifier si les crédits ont bien augmenté
      if (creditsAfter > creditsBefore) {
        console.log('✅ [MAGASIN] Crédits ajoutés avec succès!')
        showPaymentSuccess.value = true
        emit('purchased', payload)
      } else {
        // Les crédits n'ont pas augmenté = paiement échoué
        console.error('❌ [MAGASIN] Les crédits n\'ont pas été ajoutés - paiement échoué')
        paymentErrorMessage.value = 'Le paiement a échoué. Vérifiez votre solde Mobile Money et réessayez.'
        showPaymentError.value = true
      }
    } else if (status === 0) {
      // ⏳ Demande envoyée, en attente de confirmation sur le téléphone
      console.log('📲 [MAGASIN] Demande de paiement envoyée, en attente de confirmation')
      pendingPaymentPhone.value = payload.phone
      showPayment.value = false
      showPaymentPending.value = true
    } else {
      // ❌ Erreur de paiement
      console.error('❌ [MAGASIN] Échec du paiement:', paymentResult.message)
      paymentErrorMessage.value = paymentResult.message || 'Échec du paiement. Veuillez réessayer.'
      showPaymentError.value = true
    }
  } catch (e: any) {
    console.error('❌ [MAGASIN] Erreur MyPayGA:', e)
    const errorMessage = e?.message || e?.data?.message || e?.data || 'Erreur inconnue'
    paymentErrorMessage.value = `Erreur lors du paiement: ${errorMessage}\n\nVérifiez:\n• Votre numéro de téléphone\n• Votre solde Mobile Money\n• Votre connexion internet`
    showPaymentError.value = true
    showPayment.value = false
  }
}

// Fonction pour vérifier le statut du paiement en attente
async function checkPendingPayment() {
  console.log('🔄 [MAGASIN] Vérification du paiement...')
  await creditStore.refreshForCurrentUser()
  console.log('💰 [MAGASIN] Crédits actuels:', creditStore.credits)
  showPaymentPending.value = false
  showPaymentSuccess.value = true
}

// Fonction pour fermer toutes les modales
function closeAllModals() {
  showPaymentSuccess.value = false
  showPaymentPending.value = false
  showPaymentError.value = false
  showPayment.value = false
  showConfirm.value = false
  emit('close')
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
