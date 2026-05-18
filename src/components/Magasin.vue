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
            <h4 class="mt-3">Crédit rechargé !</h4>
            <p class="text-muted">Vos crédits ont bien été ajoutés à votre compte.</p>
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
            <p class="text-muted">Veuillez confirmer le paiement sur votre téléphone {{ pendingPaymentPhone }}.</p>
            <p class="text-muted small">Le paiement est validé par votre opérateur et le backend confirmera automatiquement l'ajout de crédits.</p>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button type="button" class="btn btn-outline-secondary" @click="onCancelPendingPayment">Annuler</button>
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
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

// Fonction pour charger les offres depuis l'API
async function loadOffers(silent = false) {
  if (!silent) isLoading.value = true
  try {
    if (!silent) console.log('📡 [MAGASIN] Chargement des tarifs depuis le backend (/rate/all)...')
    const res = await HttpService.get<Rate[]>('/rate/all')
    
    // Gérer différents formats de réponse
    const ratesData = res.data || res || []
    rates.value = Array.isArray(ratesData) ? ratesData : []
    
    if (rates.value.length === 0) {
      if (!silent) console.warn('⚠️ [MAGASIN] Aucun tarif reçu de l\'API')
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
    }
  } catch (e: any) {
    if (!silent) console.error('❌ [MAGASIN] Erreur lors du chargement des tarifs backend:', e)
  } finally {
    if (!silent) isLoading.value = false
  }
}

let ratesPollId: ReturnType<typeof setInterval> | null = null

function startRatesPolling() {
  stopRatesPolling()
  ratesPollId = setInterval(() => {
    loadOffers(true) // silent load
  }, 10000)
}

function stopRatesPolling() {
  if (ratesPollId) {
    clearInterval(ratesPollId)
    ratesPollId = null
  }
}

// Charger les offres au montage initial
onMounted(() => {
  loadOffers()
})

onUnmounted(() => {
  stopRatesPolling()
})

// 🔥 FIX: Recharger automatiquement les offres à chaque ouverture du magasin
watch(() => props.visible, (newValue) => {
  if (newValue) {
    console.log('🔄 [MAGASIN] Modal ouverte, rechargement des offres...')
    loadOffers()
    startRatesPolling()
  } else {
    stopRatesPolling()
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
/** Solde au moment où la demande Mobile Money est envoyée (hors statut 200 immédiat). */
const pendingPaymentBaseline = ref<number | null>(null)
/** ✅ ID de la transaction pour récupérer le vrai statut */
const pendingTransactionId = ref<number | string | null>(null)
let pendingPaymentPollId: ReturnType<typeof setInterval> | null = null
let pendingPaymentTimeoutId: ReturnType<typeof setTimeout> | null = null

function clearPendingPaymentPoll() {
  if (pendingPaymentPollId !== null) {
    clearInterval(pendingPaymentPollId)
    pendingPaymentPollId = null
  }
  if (pendingPaymentTimeoutId !== null) {
    clearTimeout(pendingPaymentTimeoutId)
    pendingPaymentTimeoutId = null
  }
}

function formatPaymentError(message?: string): string {
  const msg = (message || '').trim()
  if (!msg) {
    return 'Échec du paiement. Veuillez réessayer.'
  }
  if (/API\s*KEY\s*IS\s*MISSING/i.test(msg) || /MYPAYGA_APIKEY/i.test(msg)) {
    return (
      'Le service de paiement n\'est pas configuré sur le serveur.\n\n' +
      'L\'administrateur doit renseigner MYPAYGA_APIKEY dans le fichier .env de l\'API Laravel ' +
      '(api_toctoc_medoc), puis exécuter : php artisan config:clear\n\n' +
      'Obtenez la clé sur https://www.mypayga.com (connexion → onglet API).'
    )
  }
  if (/non configuré/i.test(msg)) {
    return msg
  }
  if (/failed to fetch|connection refused|network error|err_connection/i.test(msg)) {
    return (
      'Impossible de joindre le serveur API.\n\n' +
      'Vérifiez que l\'API Laravel tourne (php artisan serve) et que le front pointe vers https://backend.srv1079351.hstgr.cloud/api ' +
      '(fichier .env.development).'
    )
  }
  return `${msg}\n\nVérifiez votre numéro, votre solde Mobile Money et votre connexion.`
}

function startPendingPaymentPoll(payload: { method: string; phone: string; offer?: any }) {
  clearPendingPaymentPoll()

  // ✅ Si pas de transaction_id, impossible de vérifier le statut
  if (!pendingTransactionId.value) {
    console.error('❌ [MAGASIN] Pas de transaction_id, impossible de vérifier le statut')
    pendingPaymentTimeoutId = setTimeout(() => {
      clearPendingPaymentPoll()
      if (showPaymentPending.value) {
        showPaymentPending.value = false
        showPaymentError.value = true
        paymentErrorMessage.value = 'Erreur: ID de transaction manquant. Veuillez réessayer.'
      }
    }, 3000)
    return
  }

  // ✅ Vérifier le statut toutes les 3 secondes
  pendingPaymentPollId = setInterval(async () => {
    try {
      console.log('🔄 [MAGASIN] Vérification du statut de la transaction:', pendingTransactionId.value)

      const statusResponse = await MyPayGaService.getTransactionStatus(pendingTransactionId.value!)

      console.log('📦 [MAGASIN] Réponse statut:', statusResponse)

      // ✅ Traiter les différents statuts
      if (statusResponse.status === 'success') {
        console.log('✅ [MAGASIN] Paiement réussi!')
        clearPendingPaymentPoll()
        showPaymentPending.value = false
        showPaymentSuccess.value = true
        await creditStore.refreshForCurrentUser()
        emit('purchased', payload)
        return
      }

      if (statusResponse.status === 'failed') {
        console.log('❌ [MAGASIN] Paiement échoué:', statusResponse.message)
        clearPendingPaymentPoll()
        showPaymentPending.value = false
        paymentErrorMessage.value = statusResponse.message || 'Paiement refusé'
        showPaymentError.value = true
        return
      }

      if (statusResponse.status === 'timeout') {
        console.log('⏱️ [MAGASIN] Timeout:', statusResponse.message)
        clearPendingPaymentPoll()
        showPaymentPending.value = false
        paymentErrorMessage.value = statusResponse.message || 'Le délai de validation Mobile Money a expiré.'
        showPaymentError.value = true
        return
      }

      if (statusResponse.status === 'cancelled') {
        console.log('🚫 [MAGASIN] Paiement annulé:', statusResponse.message)
        clearPendingPaymentPoll()
        showPaymentPending.value = false
        paymentErrorMessage.value = statusResponse.message || 'Paiement annulé.'
        showPaymentError.value = true
        return
      }

      if (statusResponse.status === 'pending') {
        console.log('⏳ [MAGASIN] Le paiement est toujours en attente...')
        // Continuer à vérifier
        return
      }

      // Status inconnu
      console.warn('⚠️ [MAGASIN] Statut inconnu:', statusResponse.status)
    } catch (e) {
      console.warn('[MAGASIN] Erreur polling statut:', e)
      // Continuer à essayer en cas d'erreur
    }
  }, 3000)

  // ✅ Timeout global après 3 minutes
  pendingPaymentTimeoutId = setTimeout(() => {
    clearPendingPaymentPoll()
    if (showPaymentPending.value) {
      showPaymentPending.value = false
      showPaymentError.value = true
      paymentErrorMessage.value =
        'Délai dépassé. Si vous avez validé le paiement sur votre téléphone, les crédits peuvent arriver dans quelques minutes. Sinon, réessayez.'
    }
  }, 180000)
}

function onCancelPendingPayment() {
  clearPendingPaymentPoll()
  pendingPaymentBaseline.value = null
  pendingTransactionId.value = null
  showPaymentPending.value = false
}

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

    // 🎯 VALIDATION: Vérifier que le rate_id est valide
    if (!rate_id || rate_id === 0) {
      paymentErrorMessage.value = 'Impossible de trouver le tarif correspondant. Veuillez réessayer ou contacter le support.'
      showPaymentError.value = true
      return
    }

    console.log('🔍 [MAGASIN] Debug recharge crédits:')
    console.log('  - Offre:', offer)
    console.log('  - Montant:', amount)
    console.log('  - Rate ID:', rate_id)
    console.log('  - Crédits à ajouter:', creditAmount)
    console.log('  - Téléphone:', payload.phone)
    console.log('  - Méthode:', payload.method)

    const user = auth.currentUser
    
    // 🎯 VALIDATION: Vérifier que l'utilisateur est connecté
    if (!user) {
      paymentErrorMessage.value = 'Vous devez être connecté pour effectuer un achat. Veuillez vous reconnecter.'
      showPaymentError.value = true
      return
    }

    // 🎯 VALIDATION CRITIQUE: Vérifier que le token existe et est valide
    const authToken = auth.authToken
    console.log('🔐 [MAGASIN] Vérification du token d\'authentification...')
    console.log('🔐 [MAGASIN] Token présent:', !!authToken)
    
    if (!authToken) {
      console.error('❌ [MAGASIN] Aucun token d\'authentification trouvé!')
      paymentErrorMessage.value = 'Votre session a expiré. Veuillez vous déconnecter et vous reconnecter pour continuer.'
      showPaymentError.value = true
      showPayment.value = false
      return
    }

    console.log('✅ [MAGASIN] Token valide trouvé')
    console.log('📞 [MAGASIN] Appel API MyPayGa subscribe_pricing...')

    const paymentResult = await MyPayGaService.subscribePricing({
      phone: payload.phone,
      amount,
      lastname: user.pseudo || user.name || 'Client',
      email: user.email || '',
      rate_id,
      network: payload.method,
    })

    console.log('📦 [MAGASIN] Réponse MyPayGa:', paymentResult)

    const status = Number(paymentResult.request_status)
    const message = paymentResult.message || ''
    const transactionId = paymentResult.transaction_id

    // ✅ Sauvegarder le transaction_id pour récupérer le statut plus tard
    if (transactionId) {
      pendingTransactionId.value = transactionId
      console.log('✅ [MAGASIN] Transaction ID sauvegardé:', transactionId)
    }

    // Comme ttm_front : 200 = demande envoyée au téléphone ; crédits via callback MyPayGa
    if (status === 200) {
      pendingPaymentPhone.value = payload.phone
      await creditStore.refreshForCurrentUser()
      pendingPaymentBaseline.value = creditStore.credits
      showPayment.value = false
      showPaymentPending.value = true
      showPaymentError.value = false
      paymentErrorMessage.value = ''
      startPendingPaymentPoll(payload)
      return
    }

    const isPendingCallback =
      status === 0 ||
      message.toLowerCase().includes('request sent') ||
      message.toLowerCase().includes('callback')

    if (isPendingCallback) {
      pendingPaymentPhone.value = payload.phone
      await creditStore.refreshForCurrentUser()
      pendingPaymentBaseline.value = creditStore.credits
      showPayment.value = false
      showPaymentPending.value = true
      showPaymentError.value = false
      paymentErrorMessage.value = ''
      startPendingPaymentPoll(payload)
      return
    }

    showPayment.value = false
    paymentErrorMessage.value = formatPaymentError(message || 'Échec du paiement.')
    showPaymentError.value = true
    return
  } catch (e: any) {
    console.error('❌ [MAGASIN] Erreur MyPayGA:', e)
    const raw = e?.data?.message || e?.data?.detail || e?.message || 'Erreur inconnue'
    paymentErrorMessage.value = formatPaymentError(typeof raw === 'string' ? raw : JSON.stringify(raw))
    showPaymentError.value = true
    showPayment.value = false
  }
}

// Fonction pour vérifier le statut du paiement en attente
async function checkPendingPayment() {
  if (!pendingTransactionId.value) {
    paymentErrorMessage.value = 'Erreur: ID de transaction manquant. Veuillez fermer et réessayer.'
    showPaymentError.value = true
    return
  }

  console.log('🔄 [MAGASIN] Vérification manuelle du paiement...')

  try {
    const statusResponse = await MyPayGaService.getTransactionStatus(pendingTransactionId.value)
    console.log('📦 [MAGASIN] Statut reçu:', statusResponse)

    // ✅ Traiter les différents statuts
    if (statusResponse.status === 'success') {
      clearPendingPaymentPoll()
      pendingTransactionId.value = null
      showPaymentPending.value = false
      showPaymentSuccess.value = true
      await creditStore.refreshForCurrentUser()
      return
    }

    if (statusResponse.status === 'failed') {
      clearPendingPaymentPoll()
      pendingTransactionId.value = null
      showPaymentPending.value = false
      paymentErrorMessage.value = statusResponse.message || 'Paiement refusé'
      showPaymentError.value = true
      return
    }

    if (statusResponse.status === 'timeout') {
      clearPendingPaymentPoll()
      pendingTransactionId.value = null
      showPaymentPending.value = false
      paymentErrorMessage.value = 'Le délai de validation Mobile Money a expiré.'
      showPaymentError.value = true
      return
    }

    if (statusResponse.status === 'cancelled') {
      clearPendingPaymentPoll()
      pendingTransactionId.value = null
      showPaymentPending.value = false
      paymentErrorMessage.value = 'Paiement annulé.'
      showPaymentError.value = true
      return
    }

    if (statusResponse.status === 'pending') {
      console.log('⏳ [MAGASIN] Le paiement est toujours en attente')
      const userChoice = confirm(
        'Le paiement est toujours en attente.\n\n' +
        'Cela peut signifier que :\n' +
        '• Le paiement est toujours en cours de traitement\n' +
        '• Le paiement a été annulé\n' +
        '• Le paiement a échoué\n\n' +
        'Voulez-vous continuer à attendre ?\n\n' +
        'Cliquez sur "OK" pour continuer à attendre\n' +
        'Cliquez sur "Annuler" pour fermer et réessayer plus tard'
      )

      if (!userChoice) {
        clearPendingPaymentPoll()
        pendingTransactionId.value = null
        showPaymentPending.value = false
        paymentErrorMessage.value = 'Vérification annulée. Si vous avez effectué le paiement, vos crédits arriveront dans quelques minutes. Sinon, veuillez réessayer.'
        showPaymentError.value = true
      }
      return
    }

    // Status inconnu
    paymentErrorMessage.value = 'Statut de paiement inconnu. Veuillez réessayer.'
    showPaymentError.value = true
  } catch (e: any) {
    console.error('❌ [MAGASIN] Erreur lors de la vérification:', e)
    paymentErrorMessage.value = 'Impossible de vérifier le statut. Veuillez réessayer ou contacter le support.'
    showPaymentError.value = true
  }
}

// Fonction pour fermer toutes les modales
function closeAllModals() {
  clearPendingPaymentPoll()
  pendingPaymentBaseline.value = null
  pendingTransactionId.value = null
  showPaymentSuccess.value = false
  showPaymentPending.value = false
  showPaymentError.value = false
  showPayment.value = false
  showConfirm.value = false
  emit('close')
}

watch(
  () => props.visible,
  v => {
    if (!v) {
      clearPendingPaymentPoll()
      pendingPaymentBaseline.value = null
      pendingTransactionId.value = null
    }
  },
)

onUnmounted(() => {
  clearPendingPaymentPoll()
})
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
