<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import DisponibiliteMedoc from '../components/DisponibiliteMedoc.vue'
import Panier from '../components/Panier.vue'
import DonneesPerso from '../components/DonneesPerso.vue'
import Connexion from '../components/Connexion.vue'
import Inscription from '../components/Inscription.vue'
import Parametre from '../components/Parametre.vue'
import Magasin from '../components/Magasin.vue'
import Chatbot from '../components/Chatbot.vue'
import RecherchePharmacie from '../components/RecherchePharmacie.vue'
import Reservation from '../components/Reservation.vue'
import SelectPharmacy from '../components/SelectPharmacy.vue'
import TestAPI from '../components/TestAPI.vue'
import TestAuth from '../components/TestAuth.vue'
import TestAuthDirect from '../components/TestAuthDirect.vue'
import TestSimple from '../components/TestSimple.vue'
import { HomeService } from '../Services/HomeService'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
import { useCartStore } from '../stores/cart'
import { useCreditStore } from '../stores/credit'
import { CreditService } from '../Services/CreditService'
import ForgotPassword from '../components/ForgotPassword.vue'
import ChangePassword from '../components/ChangePassword.vue'
import EditProfile from '../components/EditProfile.vue'

const homeService = new HomeService()
const authStore = useAuthStore()
const appStore = useAppStore()
const cart = useCartStore()
const creditStore = useCreditStore()

// Initialiser les stores au montage du composant
onMounted(() => {
  cart.loadFromStorage()
  appStore.initializeFromStorage()
  loadAllProduct()
  // Charger les crédits utilisateur si connecté
  creditStore.refreshForCurrentUser()
  // Debug auth user
  try {
    const stored = getStoredUser()
    console.log('[Navbar] currentUser from store:', authStore.currentUser)
    console.log('[Navbar] user from localStorage:', stored)
  } catch {}
})

const products = ref<any[]>([])
const initialProducts = ref<any[]>([])
const searchTerm = ref('')
const searchDebounce = ref<number | undefined>(undefined)
let currentSearchId = 0
const showConnexion = ref(false)
const showParametre = ref(false)
const showPanier = ref(false)
const showDisponibilite = ref(false)
const showRecherche = ref(false)
const showMagasin = ref(false)
const showMobileMenu = ref(false)
const showReservation = ref(false)
const showSelectPharmacy = ref(false)
const showInscription = ref(false)
const showForgotPassword = ref(false)
const showChangePassword = ref(false)
const showEditProfile = ref(false)
const disponibilityPharmacies = ref<any[]>([])
const isLoadingDisponibilite = ref(false)
const selectedProvince = ref<string | null>(null)
const selectedPharmacy = ref<any | null>(null)
const isSearching = ref(false)
const pendingProductForCheck = ref<any | null>(null)
const isLoadingProducts = ref(true)
// Nombre d'articles visibles sur la page d'accueil
const visibleCount = ref(8)
// Notification temporaire après débit de crédit
const showCreditDebited = ref(false)
let creditDebitedTimer: number | undefined
// Erreur de chargement des produits
const isProductsError = ref(false)
const productsErrorMessage = ref('')

function notifyCreditDebited() {
  const id = 'credit-debited-toast'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id = id
    el.textContent = 'Cette action vous a pris un crédit'
    Object.assign(el.style, {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: '2000',
      background: '#dc3545',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(220,53,69,0.4)',
      fontWeight: '600',
      fontSize: '14px',
      display: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(el)
  }
  el.style.display = 'block'
  if (creditDebitedTimer) window.clearTimeout(creditDebitedTimer)
  creditDebitedTimer = window.setTimeout(() => {
    el && (el.style.display = 'none')
  }, 3000)
}

// Affiche un message d'erreur en rouge lorsqu'on tente d'ajouter un produit d'une autre pharmacie
function notifyCartPharmacyError(message: string) {
  const id = 'cart-pharmacy-error-toast'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id = id
    Object.assign(el.style, {
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '3000',
      background: '#dc3545',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(220,53,69,0.4)',
      fontWeight: '600',
      fontSize: '14px',
      display: 'none',
      maxWidth: '90%',
      textAlign: 'center',
    } as CSSStyleDeclaration)
    document.body.appendChild(el)
  }
  el.textContent = message
  el.style.display = 'block'
  window.setTimeout(() => { el && (el.style.display = 'none') }, 3500)
}

// Development helper function for testing webhook
if (import.meta.env.DEV) {
  // @ts-ignore - Development only
  window.testN8nWebhook = async (medicamentName = 'Paracetamol', province = 'Estuaire') => {
    console.log('🧪 Testing n8n webhook integration...')
    try {
      const result = await homeService.askN8nAlternatives({
        productName: medicamentName,
        province: province,
        cip: '123456'
      })
      console.log('✅ Webhook test result:', result)
      return result
    } catch (error) {
      console.error('❌ Webhook test failed:', error)
      return null
    }
  }
}

const showAISearchPanel = ref(false)
const aiText = ref('')
const aiIsParsing = ref(false)
let aiSearchReqId = 0
// AI confirmation & notice UI
const showAiConfirm = ref(false)
const aiCandidates = ref<any[]>([])
const aiOriginalQuery = ref('')
const aiPendingPlace = ref<string | null>(null)
const aiPendingQty = ref<number>(1)
const showAiNotice = ref(false)
const aiNoticeText = ref('')
const aiConfirmLoading = ref(false)

function openAiNotice(text: string) {
  aiNoticeText.value = text
  showAiNotice.value = true
}
function closeAiNotice() {
  showAiNotice.value = false
  aiNoticeText.value = ''
}
async function onPickAiCandidate(p: any) {
  showAiConfirm.value = false
  // fermer panel et lancer le flow IA avec le produit choisi
  showAISearchPanel.value = false
  await aiHeadlessReservationFlow(p, aiPendingQty.value, aiPendingPlace.value || undefined)
}

function onChangeAiQuery() {
  // Laisser l'utilisateur corriger sa requête
  showAiConfirm.value = false
  aiCandidates.value = []
  showAISearchPanel.value = true
}

// Si l'utilisateur modifie la requête, annuler toute confirmation en cours
watch(aiText, () => {
  if (showAiConfirm.value) {
    showAiConfirm.value = false
    aiCandidates.value = []
    aiConfirmLoading.value = false
  }
  // Cancel any ongoing backend search for AI when user edits text
  try { homeService.cancelSearch() } catch {}
  // Also ensure parsing spinner stops if user is editing
  aiIsParsing.value = false
})

// Debounce delay for API search (ms). Adjust to 10000 for ~10s if desired.
const SEARCH_DEBOUNCE_MS = 1200 // Recherche plus fluide (1.2s au lieu de 5s)

// Speech-to-Text (Web Speech API) for free transcription
const isTranscribing = ref(false)
let recognition: any = null
const supportsSpeech = typeof (window as any).SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined'

// Provinces connues (doit rester cohérent avec normalizeProvinceName)
const KNOWN_PROVINCES = ['Estuaire','Haut-Ogooué','Moyen-Ogooué','Ngounié','Nyanga','Ogooué-Ivindo','Ogooué-Lolo','Ogooué-Maritime','Woleu-Ntem']
const isValidProvince = (name: string | null | undefined) => !!name && KNOWN_PROVINCES.includes(String(name))

// Fuzzy matching pour provinces: tolère fautes et prefixes (ex: "estu", "haut ogo", "moyen ogo", "wol ntem")
function normalizeAscii(s: string): string {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
function tokenizeLetters(s: string): string[] {
  return normalizeAscii(s).split(/[^a-z]+/).filter(Boolean)
}
function initials(tokens: string[], n = 2): string {
  return tokens.map(t => t.slice(0, n)).join(' ')
}
function fuzzyFindProvince(input: string): string | null {
  const inTokens = tokenizeLetters(input)
  if (!inTokens.length) return null
  const inInit2 = initials(inTokens, 2)
  let best: { name: string; score: number } | null = null
  for (const prov of KNOWN_PROVINCES) {
    const pTokens = tokenizeLetters(prov)
    const pInit2 = initials(pTokens, 2)
    let score = 0
    // inclusion brute sur chaîne normalisée
    if (normalizeAscii(input).includes(normalizeAscii(prov))) score += 80
    // initials match
    if (inInit2 === pInit2) score += 70
    // correspondances de préfixes token à token (ex: estu ~ estuaire; haut ogo ~ haut ogoue)
    let prefixHits = 0
    for (const t of inTokens) {
      if (t.length < 2) continue
      if (pTokens.some(pt => pt.startsWith(t))) prefixHits++
    }
    score += Math.min(prefixHits * 10, 40)
    // correspondance partielle sur 1 lettre (faible poids)
    let tinyHits = 0
    for (const t of inTokens) {
      if (t.length === 1 && pTokens.some(pt => pt.startsWith(t))) tinyHits++
    }
    score += Math.min(tinyHits * 2, 6)
    if (!best || score > best.score) best = { name: prov, score }
  }
  // Seuil raisonnable pour éviter de deviner à tort
  return best && best.score >= 60 ? best.name : null
}

// Simple alternatives map (synonyms/brands) for common substitutions
// Keys and values should be lowercase for matching convenience
const ALTERNATIVES_MAP: Record<string, string[]> = {
  // antimalarials
  'coartem': ['artefan', 'artemether lumefantrine', 'artemether-lumefantrine', 'artemether', 'lumefantrine'],
  'artefan': ['coartem', 'artemether lumefantrine', 'artemether-lumefantrine', 'artemether', 'lumefantrine'],
  // pain/fever examples (extend as needed)
  'efferalgan': ['paracetamol', 'doliprane'],
  'doliprane': ['paracetamol', 'efferalgan'],
  'paracetamol': ['efferalgan', 'doliprane']
}

function normalizeName(s: string): string {
  return (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim()
}

function findAlternativeName(query: string): string | null {
  const q = normalizeName(query)
  // direct key
  if (ALTERNATIVES_MAP[q] && ALTERNATIVES_MAP[q].length) return ALTERNATIVES_MAP[q][0]
  // search inside keys by includes
  for (const key of Object.keys(ALTERNATIVES_MAP)) {
    if (q.includes(key)) return ALTERNATIVES_MAP[key][0]
  }
  return null
}

function findProductByNameLike(name: string): any | null {
  const n = normalizeName(name)
  const list = initialProducts.value || []
  // 1) exact or startsWith
  let hit = list.find((p: any) => normalizeName(p?.libelle || '').startsWith(n))
  if (hit) return pClone(hit)
  // 2) includes
  hit = list.find((p: any) => normalizeName(p?.libelle || '').includes(n))
  if (hit) return pClone(hit)
  // 3) token intersection heuristic
  const tokens = n.split(' ').filter(Boolean)
  let best: any = null
  let bestScore = 0
  for (const p of list) {
    const lib = normalizeName(p?.libelle || '')
    let score = 0
    for (const t of tokens) if (lib.includes(t)) score++
    if (score > bestScore) { bestScore = score; best = p }
  }
  return best ? pClone(best) : null
}

function pClone(p: any) {
  try { return JSON.parse(JSON.stringify(p)) } catch { return p }
}

function startTranscription() {
  if (!supportsSpeech || isTranscribing.value) return
  try {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognition = new SR()
    recognition.lang = 'fr-FR'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    // For short queries we can keep it non-continuous
    recognition.continuous = false

    let interim = ''
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }
      // Update text field with interim + final for better UX
      const base = aiText.value.trim()
      const merged = (base ? base + ' ' : '') + (finalTranscript || interim)
      aiText.value = merged.trim()
    }

    recognition.onerror = (e: any) => {
      console.warn('[STT] error:', e)
      isTranscribing.value = false
    }
    recognition.onend = () => {
      // End after one utterance
      isTranscribing.value = false
    }
    recognition.start()
    isTranscribing.value = true
  } catch (e) {
    console.warn('[STT] failed to start:', e)
    isTranscribing.value = false
  }
}

function stopTranscription() {
  try {
    if (recognition && isTranscribing.value) {
      recognition.stop()
    }
  } finally {
    isTranscribing.value = false
  }
}

function toggleTranscription() {
  if (!supportsSpeech) return
  if (isTranscribing.value) stopTranscription()
  else startTranscription()
}

function onAISearchClick() {
  showAISearchPanel.value = true
}

function parseAiQuery(input: string): { productName: string; quantity: number; place: string | null } {
  const text = (input || '').toString().toLowerCase()
  // quantity: prendre un nombre qui N'EST PAS un dosage (mg/ml/g/µg) et qui est contextuellement une quantité
  const unitPattern = /(mg|ml|g|µg|mcg|mg\/ml|%)/i
  const tokens = text.split(/\s+/)
  let quantity = 1
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const m = t.match(/^([0-9]{1,3})$/)
    if (m) {
      const val = parseInt(m[1], 10)
      const next = tokens[i + 1] || ''
      const prev = tokens[i - 1] || ''
      const looksLikeDosage = unitPattern.test(next)
      const qtyContext = /^(x|boite|boites|boîte|boîtes|paquet|paquets|quantite|quantité|qty)$/i.test(next) || /^(x|pour|qty|quantite|quantité)$/i.test(prev)
      if (!looksLikeDosage && (qtyContext || val <= 20)) { // heuristique simple
        quantity = Math.max(1, val)
        // marquer ce token comme utilisé pour la quantité
        tokens[i] = ''
        break
      }
    }
  }
  // city/province detection
  const knownPlaces = ['libreville', 'owendo', 'akanda', 'port-gentil', 'franceville', 'oyem', 'moanda']
  let place: string | null = knownPlaces.find(p => text.includes(p)) || null
  if (!place) {
    for (const prov of KNOWN_PROVINCES) {
      const pLow = prov.toLowerCase()
      if (text.includes(pLow)) { place = prov; break }
    }
    if (!place) {
      const fuzzy = fuzzyFindProvince(text)
      if (fuzzy) place = fuzzy
    }
  }
  // product name heuristic: remove numbers and place words, keep words with letters
  const cleaned = tokens.join(' ').replace(/[,.;:!?]/g, ' ')
  let productTokens = cleaned
    .split(/\s+/)
    .filter(w => w && !knownPlaces.includes(w))
  // remove common filler words in FR
  const stop = new Set(['je','veux','j','de','des','du','au','aux','un','une','le','la','les','à','a','en','pour','moi','chez','dans','souhaite','souhaiterais','souhait','acheter','trouve','trouver','svp','s il','s\'il','boite','boites','boîte','boîtes','desire','désire','voudrais','aimerais','me','et','&'])
  productTokens = productTokens
    .map(w => w.replace(/^(d'|d’|l'|l’)/i, '')) // enlever les contractions françaises
    .filter(w => w && !stop.has(w))
  // retirer les tokens qui correspondent à la province détectée (multi-mots)
  try {
    if (place) {
      const provTokens = tokenizeLetters(place)
      productTokens = productTokens.filter(w => {
        const nt = normalizeAscii(w)
        const wTokens = tokenizeLetters(w)
        // retirer si l'un des tokens de province est présent comme token ou sous-chaîne
        if (provTokens.some(pt => wTokens.includes(pt))) return false
        if (provTokens.some(pt => nt.includes(pt))) return false
        return true
      })
    }
  } catch {}
  // retirer également tout token qui appartient à n'importe quelle province connue (au cas où 'place' n'a pas été détectée)
  try {
    const allProvTokens = new Set<string>()
    for (const prov of KNOWN_PROVINCES) {
      for (const t of tokenizeLetters(prov)) allProvTokens.add(t)
    }
    productTokens = productTokens.filter(w => !allProvTokens.has(normalizeAscii(w)))
  } catch {}
  // si plus aucun token utile après nettoyage, renvoyer productName vide
  const productName = productTokens.join(' ').trim()
  return { productName, quantity, place }
}

async function runAiSearch(): Promise<void> {
  const q = aiText.value.trim()
  if (!q) return
  aiIsParsing.value = true
  const runId = ++aiSearchReqId
  const { productName, quantity, place } = parseAiQuery(q)

  // find best matching product (consider both loaded products and initialProducts to widen pool)
  // Exiger un nom de médicament propre; ne jamais retomber sur la phrase brute q
  if (!productName || productName.trim().length < 3) {
    aiIsParsing.value = false
    openAiNotice("Veuillez préciser le nom du médicament à rechercher (ex: Paracetamol, Efferalgan…).")
    return
  }
  const name = productName.trim()
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
  const target = norm(name)
  const poolMap = new Map<string, any>() // key by cip or libelle
  for (const arr of [products.value || [], initialProducts.value || []]) {
    for (const p of arr) {
      const key = String(p.cip ?? p.id ?? p.libelle)
      if (!poolMap.has(key)) poolMap.set(key, p)
    }
  }
  let best: any = null
  let bestScore = -1
  const scored: Array<{ item: any; score: number; label: string; overlap: number; labelNorm: string }> = []
  for (const p of poolMap.values()) {
    const libRaw = (p.libelle || '').toString()
    const lib = norm(libRaw)
    let score = 0
    if (lib === target) score += 1000
    if (lib.startsWith(target)) score += 100
    if (lib.includes(target)) score += 40
    // Token overlap including numbers (to disambiguate dosages)
    const tTokens = target.split(' ').filter(Boolean)
    const lTokens = lib.split(' ').filter(Boolean)
    let overlap = 0
    for (const t of tTokens) {
      if (lTokens.includes(t)) overlap += (/^\d/.test(t) ? 6 : 4)
    }
    score += overlap
    // small length proximity bonus
    score += Math.max(0, 10 - Math.abs(lib.length - target.length))
    scored.push({ item: p, score, label: libRaw, overlap, labelNorm: lib })
    if (score > bestScore) { bestScore = score; best = p }
  }

  aiIsParsing.value = false
  if (!best) {
    // Try alternative suggestion for AI flow too
    const altName = findAlternativeName(productName || q)
    let alt: any = null
    if (altName) alt = findProductByNameLike(altName)
    if (!alt) {
      const qn = (productName || q).toLowerCase()
      if (/(coartem|artefan|artemether|lumefantrine)/.test(qn)) {
        alt = findProductByNameLike('artefan') || findProductByNameLike('coartem')
      }
    }
    aiIsParsing.value = false
    if (alt) {
      // Proposer une confirmation avec le candidat alternatif
      aiCandidates.value = [alt]
      aiOriginalQuery.value = productName
      aiPendingPlace.value = place || null
      aiPendingQty.value = quantity
      showAiConfirm.value = true
      return
    }
    openAiNotice("Aucun produit correspondant trouvé. Essayez un autre nom.")
    return
  }

  // Déterminer un nom de base strict (mot principal) pour filtrer les candidats "mot pour mot"
  const baseTokens = target.split(' ').filter(t => t && !/^\d/.test(t))
  // Choisir comme primaryName le token qui apparaît dans le plus de libellés (pool produits)
  let primaryName = baseTokens[0] || target
  try {
    const tokenList = baseTokens.filter(t => t.length >= 3)
    if (tokenList.length) {
      let bestTok = tokenList[0]
      let bestCount = -1
      const allItems: any[] = [...(products.value || []), ...(initialProducts.value || [])]
      for (const tok of tokenList) {
        const tn = tok
        let count = 0
        for (const it of allItems) {
          const ln = (it?.libelle || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
          const lTokens = ln.split(/\s+/).filter(Boolean)
          if (lTokens.includes(tn)) count++
        }
        if (count > bestCount) { bestCount = count; bestTok = tn }
      }
      if (bestCount >= 0) primaryName = bestTok
    }
  } catch {}
  const primaryNameNorm = primaryName

  // Ouvrir la modale de confirmation en mode chargement si une confirmation est probable
  // (on la tiendra ouverte pendant la fusion backend pour montrer l'animation)
  aiConfirmLoading.value = true
  showAiConfirm.value = true
  aiOriginalQuery.value = name
  aiPendingPlace.value = place || null
  aiPendingQty.value = quantity
  // Stopper l'état "analyser" immédiatement une fois la modale ouverte
  aiIsParsing.value = false

  // Also query backend for authoritative matches and merge candidates
  try {
    // cancel any ongoing search before starting a new one
    homeService.cancelSearch()
    const apiList = await homeService.searchProducts(name)
    // Ignore if a newer run started
    if (runId !== aiSearchReqId) return
    if (Array.isArray(apiList)) {
      for (const p of apiList) {
        const key = String(p.cip ?? p.id ?? p.libelle)
        if (!poolMap.has(key)) poolMap.set(key, p)
      }
      // re-score with merged pool
      scored.length = 0
      best = null
      bestScore = -1
      for (const p of poolMap.values()) {
        const libRaw = (p.libelle || '').toString()
        const lib = norm(libRaw)
        let score = 0
        if (lib === target) score += 1000
        if (lib.startsWith(target)) score += 100
        if (lib.includes(target)) score += 40
        const tTokens = target.split(' ').filter(Boolean)
        const lTokens = lib.split(' ').filter(Boolean)
        let overlap = 0
        for (const t of tTokens) if (lTokens.includes(t)) overlap += (/^\d/.test(t) ? 6 : 4)
        score += overlap
        score += Math.max(0, 10 - Math.abs(lib.length - target.length))
        scored.push({ item: p, score, label: libRaw, overlap, labelNorm: lib })
        if (score > bestScore) { bestScore = score; best = p }
      }
    }
  } catch (e) {
    console.warn('[AI] backend search merge failed:', e)
  }
  // If query changed while we were working, abort safely
  if (runId !== aiSearchReqId || aiText.value.trim().length === 0) {
    aiConfirmLoading.value = false
    return
  }

  // Ask for confirmation unless we have an exact normalized match including dosage numbers
  // Filtrer les candidats non pertinents: au moins 1 token commun ou tous les nombres
  const numsInTarget = Array.from(target.matchAll(/\b(\d{1,4})\b/g)).map(m => m[1])
  const prelim = scored.filter(s => (s.overlap > 0) && (numsInTarget.length === 0 || numsInTarget.every(n => s.labelNorm.includes(n))))
  // Ask for confirmation unless we have an exact normalized match including dosage numbers
  // Filtrer strictement sur le nom principal (mot pour mot) dans le libellé
  let strict = scored.filter(s => {
    const tokens = (s.labelNorm || '').split(' ').filter(Boolean)
    return tokens.includes(primaryNameNorm)
  })
  // Si aucun strict, ne pas proposer des produits hors-sujet: avertir et quitter
  if (strict.length === 0) {
    aiConfirmLoading.value = false
    showAiConfirm.value = false
    aiIsParsing.value = false
    openAiNotice(`Aucun produit strictement correspondant à "${name}" n'a été trouvé. Veuillez préciser un nom exact (ex: Efferalgan, Paracetamol).`)
    return
  }
  const listToRank = (strict.length > 0 ? strict : scored)
  listToRank.sort((a, b) => b.score - a.score)
  const top = listToRank.slice(0, 5)
  const topItem = top[0]
  const secondScore = top[1]?.score ?? -1
  const topLabelNorm = topItem?.label ? norm(topItem.label) : ''
  const hasAllNums = numsInTarget.length === 0 || numsInTarget.every(n => topLabelNorm.includes(n))
  const mustConfirm = !(topItem && topItem.label && norm(topItem.label) === target && hasAllNums)
    || (secondScore > 0 && (topItem.score - secondScore) < 60)
  if (mustConfirm) {
    aiCandidates.value = top.map(t => t.item)
    aiConfirmLoading.value = false
    return
  }
  // Si pas de confirmation nécessaire, fermer l'overlay de chargement si ouvert
  aiConfirmLoading.value = false
  showAiConfirm.value = false

  // Optionnellement définir la province si le lieu est détecté (si le gestionnaire existe)
  try {
    if (place && typeof onSelectProvince === 'function') {
      onSelectProvince(place)
    }
  } catch {}

  showAISearchPanel.value = false
  aiIsParsing.value = false
  await aiHeadlessReservationFlow(best, quantity, place || undefined)
  // quantity fallback is handled inside the flow
}

// Headless, background flow for AI search: checks credit, debits, checks availability and auto-reserves
async function aiHeadlessReservationFlow(product: any, qty: number, place?: string) {
  try {
    // 1) Ensure login
    if (!isUserLoggedIn.value) {
      // ask user to login, then they can retry AI search
      showConnexion.value = true
      openAiNotice("Veuillez vous connecter pour poursuivre la recherche intelligente.")
      return
    }

    // 2) Normalize/select province silently if provided
    let province = ''
    if (place && typeof normalizeProvinceName === 'function') {
      const normProv = normalizeProvinceName(place)
      // Ne pas utiliser 'Autre' comme contrainte de province
      if (isValidProvince(normProv)) {
        province = normProv
        selectedProvince.value = province
      } else if (KNOWN_PROVINCES.map(p => p.toLowerCase()).some(p => place.toLowerCase().includes(p))) {
        // Au cas où place contient déjà un nom de province exact
        const found = KNOWN_PROVINCES.find(p => place.toLowerCase().includes(p.toLowerCase()))
        if (found) { province = found; selectedProvince.value = found }
      } else {
        // tenter fuzzy sur la saisie
        const fuzzy = fuzzyFindProvince(place)
        if (fuzzy) { province = fuzzy; selectedProvince.value = fuzzy }
      }
    }
    // Si l'utilisateur a explicitement fourni un "place" mais aucune province valide n'a été détectée, arrêter pour éviter une réservation hors-province
    if (place && !isValidProvince(province)) {
      openAiNotice("Je n'ai pas pu reconnaître la province dans votre demande. Veuillez préciser la province (ex: Estuaire, Haut-Ogooué, ...).")
      return
    }

    // 3) Préparer le contexte et vérifier la disponibilité (sans ouvrir de modales)
    appStore.setSelectedProduct(product)
    let pharmacies: any[] = []
    try {
      const response = await homeService.disponibilite(product.cip)
      pharmacies = (response?.disponibilites || []).filter((p: any) => p.statut === 'disponible' && p.qte > 0)
    } catch (e) {
      console.error(e)
      pharmacies = []
    }
    // Keep store in sync as manual flow does
    appStore.setDisponibilityPharmacies(pharmacies)

    // 4) Appliquer strictement la contrainte de province: si une province est définie et qu'aucune pharmacie n'y est disponible, ne pas réserver ailleurs
    const provinceKeyCandidate = province || selectedProvince.value || ''
    const provinceKey = isValidProvince(provinceKeyCandidate) ? provinceKeyCandidate : ''
    let candidates = pharmacies
    if (provinceKey) {
      const inProvince = pharmacies.filter((ph: any) => extractProvince(ph) === provinceKey)
      if (inProvince.length === 0) {
        // 1) Interroger le backend maison pour un alternatif structuré
        try {
          const alt: any = await homeService.alternativeByProvince({
            cip: product.cip,
            province: provinceKey,
            query: product.libelle
          })
          if (alt && alt.libelle) {
            openAiNotice(`Le produit n'est pas disponible dans ${provinceKey}.\n${alt.libelle}`)
            return
          }
        } catch {}
        // 2) Demander des suggestions textuelles à n8n avec loading et les afficher avec le préfixe requis
        console.log('[AI Flow] 🔍 Searching alternatives via n8n webhook...')
        const n8nMsg = await homeService.askN8nAlternatives({ 
          productName: product.libelle, 
          province: provinceKey, 
          cip: product.cip 
        })
        
        const header = `Le produit n'est pas disponible dans ${provinceKey}.`
        if (n8nMsg) {
          console.log('[AI Flow] ✅ Alternative found via webhook')
          openAiNotice(`${header}\n\n${n8nMsg}`)
        } else {
          console.log('[AI Flow] ❌ No alternative found via webhook')
          openAiNotice(`${header}\n\nAucune alternative trouvée pour le moment.`)
        }
        return
      }
      candidates = inProvince
    }

    // 6.b) Refine choice within candidates using commune/district matching and stock quantity
    const rawPlace = place || ''
    const norm = (s: any) => (s || '').toString().toLowerCase()
    const placeNorm = norm(rawPlace)
    const scorePharmacy = (ph: any) => {
      // Fields used in manual UI helpers
      const district = norm(ph?.souscription || ph?.pharmacie?.souscription)
      const name = norm(ph?.nom_pharmacie || ph?.pharmacie?.nom_pharmacie || ph?.name || ph?.pharmacie?.name)
      const address = norm(ph?.adresse || ph?.pharmacie?.adresse)
      const provinceField = norm(ph?.province || ph?.pharmacie?.province || ph?.region || ph?.pharmacie?.region)
      const qte = Number(ph?.qte || 0)
      let score = 0
      if (placeNorm) {
        if (district && district.includes(placeNorm)) score += 20
        if (address && address.includes(placeNorm)) score += 10
        if (name && name.includes(placeNorm)) score += 6
        if (provinceField && provinceField.includes(placeNorm)) score += 2
      }
      // Prefer higher stock slightly
      score += Math.min(qte, 10) // cap contribution
      return score
    }

    if (!candidates.length) {
      console.log('[AI Flow] 🔍 No pharmacies found, searching alternatives via n8n webhook...')
      
      const n8nMsg = await homeService.askN8nAlternatives({ 
        productName: product?.libelle, 
        province: province || selectedProvince.value || undefined, 
        cip: product?.cip 
      })
      
      const header = `Le produit n'est pas disponible dans votre zone pour le moment.`
      if (n8nMsg) {
        console.log('[AI Flow] ✅ Alternative suggestion received from webhook')
        openAiNotice(`${header}\n\n${n8nMsg}`)
      } else {
        console.log('[AI Flow] ❌ No alternative received from webhook')
        openAiNotice(`${header}\n\nNous recherchons des alternatives pour vous...`)
      }
      return
    }

    // 5) Auto-reserve: choose best candidate by commune/district score, then by stock
    let chosen = candidates[0]
    let bestScore = -Infinity
    for (const ph of candidates) {
      const sc = scorePharmacy(ph)
      if (sc > bestScore) {
        bestScore = sc
        chosen = ph
      } else if (sc === bestScore) {
        const qA = Number((chosen as any)?.qte || 0)
        const qB = Number(ph?.qte || 0)
        if (qB > qA) chosen = ph
      }
    }

    // 6) Vérifier et débiter les crédits uniquement si une pharmacie candidate a été trouvée dans la province requise
    // Rafraîchir systématiquement le solde juste avant le débit pour éviter tout décalage
    console.log('[AI Flow] Vérification des crédits...')
    await creditStore.refreshForCurrentUser()
    const availableRaw: any = creditStore.credits
    const available = Number.isFinite(Number(availableRaw)) ? Math.trunc(Number(availableRaw)) : 0
    console.log('[AI Flow] Solde disponible:', available, 'Account ID:', creditStore.accountId)
    
    if (!creditStore.accountId) {
      console.error('[AI Flow] Account ID manquant')
      showConnexion.value = true
      openAiNotice("Erreur d'authentification. Veuillez vous reconnecter.")
      return
    }
    
    if (available < 1) {
      console.log('[AI Flow] Crédits insuffisants:', available)
      showMagasin.value = true
      openAiNotice(`Crédits insuffisants (solde actuel: ${available}). Veuillez recharger votre compte pour effectuer une réservation intelligente.`)
      return
    }
    
    console.log('[AI Flow] Tentative de débit de 1 crédit...')
    const spentOk = await CreditService.souscrireCredit(creditStore.accountId, 1)
    if (!spentOk) {
      const err = CreditService.getLastError && CreditService.getLastError()
      console.error('[AI Flow] Échec du débit:', err)
      
      // Mode fallback en développement : permettre la réservation malgré l'échec du débit
      const isDev = import.meta.env.DEV
      const isEndpointNotFound = err && /HTTP\s+404/i.test(err)
      
      if (isDev && isEndpointNotFound) {
        console.warn('[AI Flow] 🚧 Mode développement: bypass du débit de crédits pour endpoint 404')
        openAiNotice("⚠️ Mode développement: réservation autorisée sans débit de crédit (API en cours de développement)")
        // Continuer avec la réservation sans débiter
      } else {
        // Analyser le type d'erreur pour donner un message approprié
        let userMessage = ''
        let shouldShowLogin = false
        let shouldShowShop = false
        
        if (err) {
          if (/HTTP\s+(401|403)/i.test(err)) {
            userMessage = "Session expirée. Veuillez vous reconnecter."
            shouldShowLogin = true
          } else if (/HTTP\s+404/i.test(err)) {
            userMessage = "Service de crédits temporairement indisponible. Essayez la réservation manuelle ou contactez le support."
            shouldShowShop = false
          } else if (/HTTP\s+400/i.test(err)) {
            userMessage = "Erreur dans les données de votre compte. Veuillez vérifier votre solde."
            shouldShowShop = true
          } else if (/timeout|network/i.test(err)) {
            userMessage = "Connexion lente. Veuillez réessayer dans quelques instants."
            shouldShowShop = false
          } else {
            userMessage = `Impossible de débiter les crédits (${err}). Vérifiez votre connexion et réessayez.`
            shouldShowShop = true
          }
        } else {
          userMessage = "Erreur technique lors de la vérification des crédits. Veuillez réessayer."
          shouldShowShop = true
        }
        
        if (shouldShowLogin) {
          showConnexion.value = true
        } else if (shouldShowShop) {
          showMagasin.value = true
        }
        
        openAiNotice(userMessage)
        return
      }
    } else {
      console.log('[AI Flow] ✅ Crédit débité avec succès')
    }
    await creditStore.refreshForCurrentUser()
    const qtyNum = Math.max(1, Number(qty || 1))
    cart.addReservation({ product, quantite: qtyNum, pharmacy: chosen, province: province || selectedProvince.value || '', reservedAt: new Date().toISOString() })

    // Open cart and show a nicer notice instead of alert
    showPanier.value = true
    openAiNotice("Réservation effectuée avec succès. Vous pouvez consulter votre panier.")
  } catch (err) {
    console.error('[AI Flow] Error:', err)
    openAiNotice("Une erreur est survenue pendant la recherche intelligente. Veuillez réessayer.")
  }
}

// Province normalization mirroring Angular behavior
function normalizeProvinceName(raw: string): string {
  const r = (raw || '').toString().trim().toLowerCase()
  if (!r) return 'Autre'
  // Normalize common variants, accents, cases
  if (/(estuaire)/.test(r)) return 'Estuaire'
  if (/(haut[-\s]?ogou[eé]e|haut ogooue|haut ogooue)/.test(r)) return 'Haut-Ogooué'
  if (/(moyen[-\s]?ogou[eé]e)/.test(r)) return 'Moyen-Ogooué'
  if (/(ngoun[ií]e|nguouni[eé])/.test(r)) return 'Ngounié'
  if (/(nyanga)/.test(r)) return 'Nyanga'
  if (/(ogoou[eé][-\s]?ivindo|ivindo)/.test(r)) return 'Ogooué-Ivindo'
  if (/(ogoou[eé][-\s]?lolo)/.test(r)) return 'Ogooué-Lolo'
  if (/(ogoou[eé][-\s]?maritime|maritime)/.test(r)) return 'Ogooué-Maritime'
  if (/(woleu[-\s]?ntem|ntem)/.test(r)) return 'Woleu-Ntem'
  return 'Autre'
}

// Map pharmacie.public_ip (1..9) to province names (order must match UI cards)
function mapPublicIpToProvince(val: any): string | null {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  const mapping = [
    'Estuaire',            // 1
    'Haut-Ogooué',         // 2
    'Moyen-Ogooué',        // 3
    'Ngounié',             // 4
    'Nyanga',              // 5
    'Ogooué-Ivindo',       // 6
    'Ogooué-Lolo',         // 7
    'Ogooué-Maritime',     // 8
    'Woleu-Ntem',          // 9
  ]
  const idx = Math.trunc(n) - 1
  if (idx >= 0 && idx < mapping.length) return mapping[idx]
  return null
}

function extractProvince(ph: any): string {
  // Try multiple possible fields, including nested structures
  const candidates: any[] = [
    ph?.province,
    ph?.Province,
    ph?.provinceName,
    ph?.region,
    ph?.public_ip?.province,
    ph?.public_ip?.region,
    ph?.pharmacie?.province,
    ph?.pharmacie?.Province,
    ph?.pharmacie?.provinceName,
    ph?.pharmacie?.region,
  ]
  // Highest priority: numeric mapping from pharmacie.public_ip
  const byPublicIp = mapPublicIpToProvince(ph?.pharmacie?.public_ip)
  if (byPublicIp) return byPublicIp
  for (const c of candidates) {
    if (c) return normalizeProvinceName(String(c))
  }
  return 'Autre'
}

// Group pharmacies by province-like key for DisponibiliteMedoc modal
const groupedDisponibility = computed<Record<string, any[]>>(() => {
  const map: Record<string, any[]> = {}
  for (const ph of appStore.disponibilityPharmacies) {
    const key = extractProvince(ph)
    if (!map[key]) map[key] = []
    map[key].push(ph)
  }
  return map
})
// Pharmacies list scoped to the currently selected province for confirmation step
const pharmaciesInSelectedProvince = computed<any[]>(() => {
  if (!selectedProvince.value) return []
  const key = selectedProvince.value
  return appStore.disponibilityPharmacies.filter((ph: any) => extractProvince(ph) === key)
})
const showDonneesPerso = ref(false)

const isUserLoggedIn = computed(() => authStore.isLoggedIn)

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

const displayName = computed<string>(() => {
  const u = authStore.currentUser || getStoredUser() || null
  if (!u) return ''
  const fromEmail = (u.email && typeof u.email === 'string') ? String(u.email).split('@')[0] : ''
  // Common combinations for full name
  const first = u.firstname || u.first_name || u.prenom || u.firstName
  const last = u.lastname || u.last_name || u.nom || u.lastName
  if (first && last) return `${first} ${last}`
  if (first) return String(first)
  if (last) return String(last)
  // Single-field candidates
  return (
    u.username ||
    u.pseudo ||
    u.name ||
    u.login ||
    u.identifiant ||
    fromEmail ||
    ''
  )
})

const welcomeText = computed(() =>
  isUserLoggedIn.value && displayName.value
    ? `Bienvenue sur Toctoc Médoc ${displayName.value}`
    : ''
)

// Log when user changes
watch(() => authStore.currentUser, (nu) => {
  console.log('[Navbar] currentUser changed:', nu)
}, { deep: true })
const hasCartItems = computed(() => cart.hasItems)
const cartItemCount = computed(() => cart.itemCount)


async function loadAllProduct() {
  isLoadingProducts.value = true
  isProductsError.value = false
  productsErrorMessage.value = ''
  try {
    console.log('📦 [PRODUCTS] Chargement des produits...')
    
    // Charger un échantillon plus large pour avoir plus de choix
    const data = await homeService.getAllProduct(1, 100)
    initialProducts.value = data || []
    
    if (data && data.length > 0) {
      console.log('✅ [PRODUCTS] Affichage des produits')
      products.value = data.slice(0, visibleCount.value)
    } else {
      products.value = []
    }
  } catch (e) {
    console.error('❌ [PRODUCTS] Erreur:', e)
    products.value = []
    initialProducts.value = []
    isProductsError.value = true
    productsErrorMessage.value = (e as any)?.message || 'Impossible de charger les produits.'
  } finally {
    isLoadingProducts.value = false
  }
}

function retryLoadProducts() {
  loadAllProduct()
}

function loadMore() {
  // Afficher jusqu'à 2000 produits en une seule action
  const maxToShow = Math.min(2000, (initialProducts.value || []).length)
  visibleCount.value = maxToShow
  products.value = (initialProducts.value || []).slice(0, visibleCount.value)
}

function reduceList() {
  // Réduire l'affichage aux 8 premiers produits
  visibleCount.value = 8
  products.value = (initialProducts.value || []).slice(0, visibleCount.value)
}

async function onSearchInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  searchTerm.value = val

  // Debounce pour éviter les requêtes excessives
  if (searchDebounce.value) clearTimeout(searchDebounce.value)

  // Affichage instantané: filtrage local immédiat
  const qInstant = val.trim().toLowerCase()
  if (qInstant.length === 0) {
    // Arrêter la recherche en cours
    isSearching.value = false
    products.value = (initialProducts.value || []).slice(0, visibleCount.value)
    return
  }
  
  // Filtrage local instantané pour une meilleure UX
  const local = (initialProducts.value || []).filter((p: any) => {
    const name = (p?.libelle || '').toString().toLowerCase()
    return name.includes(qInstant)
  })
  if (local.length > 0) {
    products.value = local.slice(0, 20)
  }

  // Démarrer l'animation de recherche
  if (qInstant.length > 2) {
    isSearching.value = true
  }

  // Lancer la recherche API après debounce
  const q = val.trim()
  searchDebounce.value = window.setTimeout(() => { performSearch(q) }, SEARCH_DEBOUNCE_MS)
}

function onModalQueryChange(q: string) {
  searchTerm.value = q
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  // Affichage instantané pour la modale aussi
  const qInstant = q.trim().toLowerCase()
  if (qInstant.length === 0) {
    products.value = (initialProducts.value || []).slice(0, visibleCount.value)
  } else {
    const local = (initialProducts.value || []).filter((p: any) => {
      const name = (p?.libelle || '').toString().toLowerCase()
      return name.includes(qInstant)
    })
    if (local.length > 0) {
      products.value = local.slice(0, 12)
    }
  }
  // Déclencher l'API après un temps de pause (debounce)
  const term = q.trim()
  searchDebounce.value = window.setTimeout(() => { performSearch(term) }, SEARCH_DEBOUNCE_MS)
}

// Déclencheur immédiat (Enter, blur)
function triggerImmediateSearch(openModal = false) {
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  const q = searchTerm.value.trim()
  if (q.length === 0) {
    products.value = (initialProducts.value || []).slice(0, 8)
  } else {
    performSearch(q)
  }
  if (openModal) showRecherche.value = true
}

// Recherche centralisée: utilise l'API puis filtre les 10 premiers produits dont le libellé commence par la requête
async function performSearch(q: string) {
  try {
    if (q.length === 0) {
      products.value = (initialProducts.value || []).slice(0, visibleCount.value)
      return
    }
    isSearching.value = true
    const searchId = ++currentSearchId
    
    // Délai minimum pour voir l'animation (UX)
    const [apiResults] = await Promise.all([
      homeService.searchProducts(q),
      new Promise(resolve => setTimeout(resolve, 800)) // Animation visible minimum 800ms
    ])
    if (searchId !== currentSearchId) {
      // Réponse obsolète, on l'ignore
      return
    }
    const lower = q.toLowerCase()
    // Résultats locaux immédiats (includes)
    const local = (initialProducts.value || []).filter((p: any) => {
      const name = (p?.libelle || '').toString().toLowerCase()
      return name.includes(lower)
    })
    // Résultats API filtrés
    const apiFiltered = (apiResults || []).filter((p: any) => {
      const name = (p?.libelle || '').toString().toLowerCase()
      return name.includes(lower)
    })
    // Fusion dédupliquée (prioriser API en premier)
    const seen = new Set<string>()
    const toKey = (p: any) => (p?.cip ? String(p.cip) : (p?.libelle || '').toString().toLowerCase())
    const merged: any[] = []
    for (const item of apiFiltered) {
      const k = toKey(item)
      if (!seen.has(k)) { seen.add(k); merged.push(item) }
    }
    for (const item of local) {
      const k = toKey(item)
      if (!seen.has(k)) { seen.add(k); merged.push(item) }
    }
    if (merged.length > 0) {
      products.value = merged.slice(0, 12)
    } else {
      // No direct results: try to propose an alternative
      const altName = findAlternativeName(q)
      let altProduct: any = null
      if (altName) {
        altProduct = findProductByNameLike(altName)
      }
      // If still not found, try to infer by active ingredient style tokens
      if (!altProduct) {
        // heuristics for artemether/lumefantrine family
        const qn = normalizeName(q)
        if (/(coartem|artefan|artemether|lumefantrine)/.test(qn)) {
          altProduct = findProductByNameLike('artefan') || findProductByNameLike('coartem')
        }
      }
      if (altProduct) {
        alert(`Produit introuvable. Veuillez plutôt essayer avec le produit "${altProduct.libelle}".`)
        products.value = [altProduct]
        // Optionally also update the search term to alt name for clarity
        // searchTerm.value = altProduct.libelle
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSearching.value = false
  }
}

async function disponibilite(product: any) {
  if (!isUserLoggedIn.value) {
    // Mémoriser l'action demandée pour reprise après connexion
    pendingProductForCheck.value = product
    showConnexion.value = true
    return
  }
  try {
    appStore.setSelectedProduct(product)
    appStore.setLoadingDisponibilite(true)
    // Ouvrir la modale immédiatement pour afficher le chargement
    showDisponibilite.value = true
    const response = await homeService.disponibilite(product.cip)
    const pharmacies = (response?.disponibilites || []).filter((p: any) => p.statut === 'disponible' && p.qte > 0)
    appStore.setDisponibilityPharmacies(pharmacies)
  } catch (err) {
    console.error(err)
    appStore.setDisponibilityPharmacies([])
  } finally {
    appStore.setLoadingDisponibilite(false)
  }
}

function onSelectProvince(key: string) {
  selectedProvince.value = key
}

async function onConfirmProvince(key: string) {
  selectedProvince.value = key
  // Vérifier uniquement le solde de crédits (> 0). Ne pas débiter à cette étape.
  const proceed = async () => {
    // S'assurer que le solde est à jour
    if (!creditStore.accountId) {
      await creditStore.refreshForCurrentUser()
    } else {
      // Même si accountId existe, on peut rafraîchir pour la dernière valeur de crédits
      await creditStore.refreshForCurrentUser()
    }
    const available = Number(creditStore.credits || 0)
    if (creditStore.accountId && available > 0) {
      // Ouvrir le modal de sélection de pharmacie
      showDisponibilite.value = false
      showSelectPharmacy.value = true
      showMagasin.value = false
    } else {
      // Crédits insuffisants: ouvrir le magasin
      showDisponibilite.value = false
      showSelectPharmacy.value = false
      showMagasin.value = true
    }
  }
  proceed()
}

function onPharmacySelected(ph: any) {
  selectedPharmacy.value = ph
  showSelectPharmacy.value = false
  showReservation.value = true
}

function onMultiplePharmaciesSelected(pharmacies: any[]) {
  const product = appStore.selectedProduct
  const province = selectedProvince.value || ''
  
  if (product && pharmacies.length > 0) {
    // Ajouter chaque pharmacie au panier avec quantité par défaut de 1
    pharmacies.forEach(pharmacy => {
      cart.addReservation({ 
        product, 
        quantite: 1, 
        pharmacy, 
        province, 
        reservedAt: new Date().toISOString() 
      })
    })
    
    // Notification de succès
    const count = pharmacies.length
    const productName = product.libelle || 'Produit'
    alert(`✅ ${count} réservation${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} au panier pour "${productName}"`)
    
    // Fermer la modal
    showSelectPharmacy.value = false
    
    // Optionnellement, afficher le panier
    // showPanier.value = true
  }
}

function onReservationConfirm(payload: any) {
  const qty = Number(payload?.quantite || 1)
  const product = appStore.selectedProduct
  const province = selectedProvince.value || ''
  const pharmacy = selectedPharmacy.value
  if (product && pharmacy) {
    const res = cart.addReservation({ product, quantite: Math.max(1, qty), pharmacy, province, reservedAt: new Date().toISOString() })
    if (!res?.ok) {
      notifyCartPharmacyError('Attention, vous ne pouvez pas faire la réservation dans deux pharmacies différentes')
      // Ne pas ouvrir le panier dans ce cas
      showReservation.value = false
      return
    }
  }
  showReservation.value = false
  showPanier.value = true
}

function onLoginSuccess() {
  showConnexion.value = false
  // Reprendre l'action de vérification si elle était en attente
  if (pendingProductForCheck.value) {
    const prod = pendingProductForCheck.value
    pendingProductForCheck.value = null
    // Lancer la disponibilité maintenant que l'utilisateur est connecté
    disponibilite(prod)
  }
  // Rafraîchir les crédits après connexion
  creditStore.refreshForCurrentUser()
}

function onLogout() {
  // nothing else needed, computed will react
  showParametre.value = false
}

function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value
}

async function onPurchased(payload: any) {
  // Après paiement MyPayGA, le backend met à jour le solde: on rafraîchit simplement
  console.log('✅ Achat validé:', payload)
  await creditStore.refreshForCurrentUser()
}

// Ajout des partenaires demandés pour la section "Nos pharmacies partenaires"
const partenaires = [
  "AYITEBE",
  "AKEWA",
  "SOS BIBIKI",
  "MARIE LAMLET",
  "LIBWE",
  "EL RAPHA",
  "MANIEVA"
]
</script>

<template>
  <!-- Modals / Overlays -->
  <DisponibiliteMedoc :visible="showDisponibilite" :groupedPharmacies="groupedDisponibility"
    :loading="appStore.isLoadingDisponibilite" @close="showDisponibilite = false" @selectProvince="onSelectProvince"
    @confirmSelection="onConfirmProvince" />
  <SelectPharmacy :visible="showSelectPharmacy" :province="selectedProvince" :pharmacies="pharmaciesInSelectedProvince" :product="appStore.selectedProduct"
    @close="showSelectPharmacy = false" @select="onPharmacySelected" @selectMultiple="onMultiplePharmaciesSelected" />
  <Reservation :visible="showReservation" :province="selectedProvince" :pharmacy="selectedPharmacy" :product="appStore.selectedProduct"
    @close="showReservation = false" @confirm="onReservationConfirm" />
  <Panier :visible="showPanier" @close="showPanier = false" />
  <DonneesPerso :visible="showDonneesPerso" @close="showDonneesPerso = false" />
  <Connexion v-if="showConnexion" :visible="showConnexion" @close="showConnexion = false"
    @loginSuccess="onLoginSuccess"
    @openInscription="showConnexion = false; showInscription = true"
    @forgotPassword="showConnexion = false; showForgotPassword = true" />
  <Inscription v-if="showInscription" :visible="showInscription"
    @close="showInscription = false"
    @openConnexion="showInscription = false; showConnexion = true"
    @registerSuccess="onLoginSuccess" />
  <ForgotPassword :visible="showForgotPassword" @close="showForgotPassword = false" />
  <ChangePassword :visible="showChangePassword" @close="showChangePassword = false" @updated="showChangePassword = false" />
  <EditProfile :visible="showEditProfile" @close="showEditProfile = false" @updated="showEditProfile = false" />
  <Parametre :visible="showParametre" @logout="onLogout" @close="showParametre = false"
    @openStore="showMagasin = true; showParametre = false"
    @changePassword="showParametre = false; showChangePassword = true"
    @editProfile="showParametre = false; showEditProfile = true" />
  <RecherchePharmacie :visible="showRecherche" :results="products" :query="searchTerm" :loading="isSearching" @close="showRecherche = false"
    @select="disponibilite" @queryChange="onModalQueryChange" />
  <Magasin :visible="showMagasin" @close="showMagasin = false" @purchased="onPurchased" />

  <!-- AI Notice Modal (better design instead of alert) -->
  <div v-if="showAiNotice" class="modal-overlay" @click.self="closeAiNotice()">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title d-flex align-items-center">
          <i class="bi bi-info-circle me-2"></i>
          <span>Information</span>
        </div>
        <button class="btn-close" @click="closeAiNotice()"></button>
      </div>
      <div class="modal-body">
        <p style="white-space: pre-line;">{{ aiNoticeText }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="closeAiNotice()">OK</button>
      </div>
    </div>
  </div>

  <!-- AI Confirm Modal for fuzzy product matches -->
  <div v-if="showAiConfirm" class="modal-overlay" @click.self="showAiConfirm=false">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title d-flex align-items-center">
          <i class="bi bi-capsule me-2"></i>
          <span>Confirmer le médicament</span>
        </div>
        <button class="btn-close" @click="showAiConfirm=false"></button>
      </div>
      <div class="modal-body">
        <p class="mb-2">Vous avez demandé: <strong>{{ aiOriginalQuery }}</strong></p>
        <template v-if="aiConfirmLoading">
          <div class="d-flex align-items-center justify-content-center py-4">
            <div class="spinner-border text-primary me-2" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <span class="text-muted">Recherche des meilleurs correspondances…</span>
          </div>
        </template>
        <template v-else>
          <p class="text-muted">Sélectionnez le produit correspondant ci-dessous:</p>
          <div class="list-group">
            <button v-for="(c, idx) in aiCandidates" :key="idx" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="onPickAiCandidate(c)">
              <span>{{ c.libelle }}</span>
              <i class="bi bi-arrow-right-short fs-4"></i>
            </button>
          </div>
        </template>
      </div>
      <div class="modal-footer d-flex justify-content-between">
        <button class="btn btn-secondary" @click="showAiConfirm=false">Annuler</button>
        <button class="btn btn-outline-primary" @click="onChangeAiQuery()">Changer ma requête</button>
      </div>
    </div>
  </div>

  <!-- Navbar -->
  <nav class="modern-navbar shadow">
    <div class="container ms-5 position-relative">
      <div class="d-flex justify-content-between align-items-center py-3">
        <div class="d-flex align-items-center">
          <img src="/assets/Fichier 12.svg" width="100" alt="Logo_Ttm" />
        </div>
        <!-- Centered welcome text with pharmacies button -->
        <div class="position-absolute top-50 start-50 translate-middle d-flex align-items-center" style="color:#0F7ABB; white-space: nowrap;">
          <span class="fw-semibold">{{ welcomeText }}</span>
          <button v-if="isUserLoggedIn" class="btn btn-outline-primary btn-sm ms-3" style="border-radius: 20px; font-size: 12px;" @click="showRecherche = true">
            <i class="bi bi-building me-1"></i>
            Pharmacies
          </button>
        </div>
        <!-- Desktop actions -->
        <div class="d-none d-md-flex ">
          <template v-if="isUserLoggedIn">
            <button class="me-3" style="border: none;" @click="showParametre = true">
              <span class="badge bg-success p-2" style="border-radius: 50px;">
                <i class="bi bi-gear-wide-connected" style="font-size:25px"></i>
              </span>
            </button>
            <button style="border: none;" @click="showPanier = true">
              <span class="badge bg-success p-2 position-relative" style="border-radius: 50px;">
                <i class="bi bi-cart4" style="font-size:25px"></i>
                <span v-if="hasCartItems" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 11px;">
                  {{ cartItemCount }}
                </span>
              </span>
            </button>
            <div class="credit-badge ms-3" @click="showMagasin = true">
              <i class="fa-solid fa-crown icon"></i>
              <span class="text">{{ creditStore.credits }} crédits</span>
            </div>
          </template>
          <template v-else>
            <button type="button"
              style="border-radius: 15px; border: none; font-size: 16px; font-family: sans-serif; color: white; background-color: #3AB24F;"
              class="btn fw-bold py-2 px-3 me-2" @click="showConnexion = true">
              Se connecter
            </button>
          </template>
        </div>
        <!-- Mobile hamburger -->
        <div class="d-flex d-md-none">
          <template v-if="isUserLoggedIn">
            <button class="btn mobile-menu-btn" style="border: none;" @click="toggleMobileMenu">
              <i class="bi bi-list" style="font-size: 28px;"></i>
            </button>
          </template>
          <template v-else>
            <button type="button"
                    class="btn fw-bold text-white"
                    style="border-radius: 15px; background-color: #3AB24F;"
                    @click="showConnexion = true">
              Se connecter
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>

  <!-- Mobile Sidebar -->
  <div v-if="showMobileMenu" class="mobile-menu-overlay" @click.self="toggleMobileMenu">
    <div class="mobile-sidebar">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <img src="/assets/Fichier 12.svg" width="90" alt="Logo_Ttm" />
        <button class="btn" style="border: none;" @click="toggleMobileMenu">
          <i class="bi bi-x-lg" style="font-size: 20px;"></i>
        </button>
      </div>
      <div class="list-group">
        <template v-if="isUserLoggedIn">
          <button class="list-group-item list-group-item-action" @click="showParametre = true; toggleMobileMenu()">
            <i class="bi bi-gear me-2"></i> Paramètres
          </button>
          <button class="list-group-item list-group-item-action d-flex align-items-center justify-content-between" @click="showPanier = true; toggleMobileMenu()">
            <span><i class="bi bi-cart4 me-2"></i> Panier</span>
            <span v-if="hasCartItems" class="badge rounded-pill bg-danger">{{ cartItemCount }}</span>
          </button>
          <button class="list-group-item list-group-item-action" @click="showMagasin = true; toggleMobileMenu()">
            <i class="bi bi-bag me-2"></i> Magasin de crédits
          </button>
        </template>
        <template v-else>
          <button class="list-group-item list-group-item-action" @click="showConnexion = true; toggleMobileMenu()">
            <i class="bi bi-box-arrow-in-right me-2"></i> Se connecter
          </button>
        </template>
      </div>
      <!-- Credits fixed at bottom on mobile sidebar -->
      <div class="mobile-credits" v-if="isUserLoggedIn" @click="showMagasin = true; toggleMobileMenu()">
        <div class="credit-badge w-100 d-flex align-items-center justify-content-between">
          <span class="d-flex align-items-center">
            <i class="fa-solid fa-crown icon me-2"></i>
            <span class="text">{{ creditStore.credits }} crédits</span>
          </span>
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>

  <!-- Hero -->
  <section class="hero-section parallax-bg">
    <div class="container ms-5" style="margin-top: 10px;">
      <div class="row align-items-center mt-2">
        <div class="col-lg-6 col-md-12 hero-content mt-5 order-1 order-md-1 text-md-start">
          <div class="hero-badge fade-in-up">✨ Nouveauté !</div>
          <h1 class="hero-title fade-in-up" style="animation-delay: 0.2s;">Découvrez Toctoc Médoc</h1>
          <p class="hero-subtitle fade-in-up" style="animation-delay: 0.4s;">
            Notre nouvelle solution révolutionnaire de disponibilité de médicaments. Vérifiez la disponibilité de vos
            médicaments dans les pharmacies les plus proches de chez vous à partir de votre tablette, smartphone ou
            ordinateur !
          </p>
          <div class="d-flex flex-row align-items-center justify-content-center gap-3 hero-actions">
            <a class="btn btn-modern fade-in-up text-white" style="animation-delay: 0.6s;" href="https://epharma.ga/">En
              savoir plus</a>
            <button class="btn btn-modern fade-in-up text-white" style="animation-delay: 0.6s;"
              @click="showDonneesPerso = true">Politique de confidentialité</button>
          </div>
        </div>
        <div class="col-lg-6 col-md-12 text-center pt-5 mt-lg-0 order-2 order-md-2">
          <img class="hero-user-img img-fluid pt-5 ps-5 ms-5" style="margin-top: 70px;" src="/assets/user.png" alt="user" />
        </div>
      </div>
    </div>
  </section>

  <!-- Provinces -->
  <section class="provinces-section">
    <div class="container-fluid">
      <div class="text-center mb-4">
        <h5 class="fw-bold">Toctoc Médoc est disponible dans vos provinces</h5>
      </div>
      <div class="province-scroll">
        <div class="province-item"><img src="/assets/Estuaire.png" alt="Estuaire" class="province-icon me-3"
            style="height: 3vh;" />ESTUAIRE</div>
        <div class="province-item"><img src="/assets/Haut-Ogooué.png" alt="Haut-Ogooué" class="province-icon me-3"
            style="height: 3vh;" />HAUT-OGOOUE</div>
        <div class="province-item"><img src="/assets/Nguounié.png" alt="Ngounié" class="province-icon me-3"
            style="height: 3vh;" />NGOUNIE</div>
        <div class="province-item"><img src="/assets/Ogooué-Lolo.png" alt="Ogooué-Lolo" class="province-icon me-3"
            style="height: 3vh;" />OGOOUE-LOLO</div>
        <div class="province-item"><img src="/assets/Woleu-Ntem.png" alt="Woleu-Ntem" class="province-icon me-3"
            style="height: 3vh;" />WOLEU-NTEM</div>
      </div>
    </div>
  </section>

  <!-- Search and Products -->
  <section class="search-section d-flex justify-content-center">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">Tous les produits disponibles</h2>
        <p class="lead">Recherchez et vérifiez la disponibilité de vos médicaments</p>
      </div>
      <div class="search-container mb-5">
        <div class="search-input-wrapper">
          <input type="text" class="search-input" :value="searchTerm" @input="onSearchInput"
            @keyup.enter.prevent="triggerImmediateSearch(true)" @blur="triggerImmediateSearch(false)" placeholder="Rechercher un médicament..." />
        </div>
        <div class="search-actions">
          <button class="icon-btn" type="button" @click="triggerImmediateSearch(true)" title="Rechercher">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
          <button class="icon-btn" type="button" @click="onAISearchClick()" title="Recherche intelligente (IA)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 3l1.5 3L10 7.5 6.5 9 5 12 3.5 9 0 7.5 3.5 6 5 3zm10 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zm-4 6l1.2 2.4L15.5 13 12.2 14.6 11 17l-1.2-2.4L6.5 13l3.3-1.6L11 10z" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="isLoadingProducts" class="text-center text-muted my-4">
        chargement des produits en cours....
      </div>
      <div v-else>
        <!-- Spinner d'attente pendant la recherche (sablier gris) -->
        <div v-if="isSearching" class="products-loader d-flex justify-content-center align-items-center my-5">
          <img src="/assets/loader-hourglass-gray.svg" alt="Chargement..." class="hourglass-gray" />
        </div>
        <div v-else-if="isProductsError || products.length === 0" class="d-flex flex-column align-items-center my-4">
          <div class="alert alert-warning text-center" role="alert">
            <div class="fw-semibold">Une erreur est survenue lors du chargement des produits.</div>
            <div class="small text-muted mt-1">{{ productsErrorMessage }}</div>
          </div>
          <button class="btn btn-outline-primary" @click="retryLoadProducts">Réessayer</button>
        </div>
        <div v-else class="row g-4 justify-content-center">
          <div class="col-lg-3 col-md-8 col-sm-12" v-for="(product, idx) in products" :key="idx">
            <div class="product-card mb-4 mx-3">
              <div class="product-image">
                <img :src="product.photoURL || '/assets/placeholder.png'" :alt="product.libelle" loading="lazy" />
              </div>
              <div class="product-info">
                <h6 class="product-title">{{ product.libelle }}</h6>
                <span class="prescription-badge prescription-not-required">Sous ordonnance : {{
                  product.prescriptionRequired
                    ? 'Oui' : 'Non' }}</span>
                <button class="btn-verify" @click="disponibilite(product)">Vérifier la disponibilité</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Actions liste produits: Voir plus / Réduire -->
      <div v-if="!isLoadingProducts && searchTerm.trim().length === 0" class="text-center mt-3">
        <button
          v-if="products.length < Math.min(2000, initialProducts.length)"
          class="btn btn-primary px-4 py-2"
          style="border-radius: 12px;"
          @click="loadMore"
        >Voir plus</button>
        <button
          v-else-if="initialProducts.length > 8"
          class="btn btn-outline-secondary px-4 py-2 ms-2"
          style="border-radius: 12px;"
          @click="reduceList"
        >Réduire</button>
      </div>
    </div>
  </section>

  <!-- Partners -->
  <section class="partners-section d-flex justify-content-center">
    <div class="container d-flex justify-content-center align-items-center flex-column">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3 ms-3">Nos pharmacies partenaires</h2>
        <p class="lead">Ces personnes nous font confiance et nous accompagnent</p>
      </div>
      <!-- Défilement vertical des partenaires -->
      <div class="vertical-marquee">
        <div class="vertical-marquee-content">
          <!-- Pharmacies déjà présentes -->
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2"><img src="/assets/WhatsApp_Image_2024-11-28_à_10.52.22_fbd8147c-removebg-preview.png"
                  width="80" alt="" /></div>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">💊</div><small class="fw-bold">Pharmacie CENTRALE</small>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">🏥</div><small class="fw-bold">Pharmacie MODERNE</small>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">💊</div><small class="fw-bold">Pharmacie SANTE</small>
            </div>
          </div>
          <!-- Nouvelles pharmacies partenaires -->
          <div
            v-for="(pharma, idx) in partenaires"
            :key="pharma + idx"
            class="partner-logo-vertical p-3"
          >
            <div class="text-center">
              <div class="mb-2">
                <i class="bi bi-building" style="font-size:2rem;"></i>
              </div>
              <small class="fw-bold">{{ pharma }}</small>
            </div>
          </div>
          <!-- Dupliquer pour effet infini -->
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2"><img src="/assets/WhatsApp_Image_2024-11-28_à_10.52.22_fbd8147c-removebg-preview.png"
                  width="80" alt="" /></div>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">💊</div><small class="fw-bold">Pharmacie CENTRALE</small>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">🏥</div><small class="fw-bold">Pharmacie MODERNE</small>
            </div>
          </div>
          <div class="partner-logo-vertical p-3">
            <div class="text-center">
              <div class="mb-2">💊</div><small class="fw-bold">Pharmacie SANTE</small>
            </div>
          </div>
          <div
            v-for="(pharma, idx) in partenaires"
            :key="'dup-' + pharma + idx"
            class="partner-logo-vertical p-3"
          >
            <div class="text-center">
              <div class="mb-2">
                <i class="bi bi-building" style="font-size:2rem;"></i>
              </div>
              <small class="fw-bold">{{ pharma }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="stats-section parallax-bg d-flex justify-content-center">
    <div class="container d-flex justify-content-center align-items-center flex-column">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">Les Statistiques Toctoc Médoc</h2>
        <p class="lead">Découvrez les chiffres qui illustrent notre succès et la confiance de nos clients</p>
      </div>
      <div class="row g-4 d-flex justify-content-center">
        <div class="col-lg-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-number">11+</div>
            <div class="stat-label">Villes enregistrées</div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-number">16+</div>
            <div class="stat-label">Pharmacies connectées</div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-number">121+</div>
            <div class="stat-label">Utilisateurs</div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-number">100+</div>
            <div class="stat-label">Nouvelles Connexions</div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Support Disponible</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section class="contact-section d-flex justify-content-center">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">À propos de nous</h2>
        <p class="lead text-muted">Contactez-nous pour plus d'informations</p>
      </div>
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="contact-card mx-2">
                <div class="contact-icon">📍</div>
                <h5 class="fw-bold mb-3">Adresse</h5>
                <p class="text-muted">E-Pharma, Coworking SING SA Bureau 2, Rue-Pecqueur, Centre-Ville, Libreville Gabon
                </p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="contact-card ms-3">
                <div class="contact-icon">📞</div>
                <h5 class="fw-bold mb-3">Appelez-nous</h5>
                <p class="text-muted">+241 62387401<br />+241 76238447</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="contact-card mx-2">
                <div class="contact-icon">✉️</div>
                <h5 class="fw-bold mb-3">Email</h5>
                <p class="text-muted">contact@toctocmedoc.ga</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="contact-card ms-3">
                <div class="contact-icon">🌐</div>
                <h5 class="fw-bold mb-3">Site Web</h5>
                <p class="text-muted">www.toctocmedoc.ga</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="contact-form ms-5">
            <div class="contact-icon mb-3">📝</div>
            <h5 class="fw-bold mb-4 text-center">Envoyer un message</h5>
            <form @submit.prevent>
              <div class="form-floating mb-3"><input type="text" class="form-control" id="name"
                  placeholder="Votre nom" /><label for="name">Votre nom</label></div>
              <div class="form-floating mb-3"><input type="email" class="form-control" id="email2"
                  placeholder="Votre email" /><label for="email2">Votre email</label></div>
              <div class="form-floating mb-3"><textarea class="form-control" id="message" rows="4"
                  placeholder="Votre message"></textarea><label for="message">Votre message</label></div>
              <button type="submit" class="btn btn-primary col-md-4  p-2" style="border-radius: 15px;">Envoyer</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="text-center py-4 d-flex justify-content-center"
    style="background: var(--primary-color); color: white;">
    <div class="container">
      <p class="mb-0"> 2023 Toctocmedoc. Tous droits réservés.</p>
      <p class="mb-0">Développé avec ❤️ par E-Pharma</p>
    </div>
  </footer>

  
  <!-- Floating Chatbot -->
  <Chatbot />

  <!-- AI Search Panel -->
  <div v-if="showAISearchPanel" class="ai-overlay" @click.self="showAISearchPanel=false">
    <div class="ai-panel">
      <div class="ai-header">
        <strong>Recherche intelligente (IA)</strong>
        <button class="btn btn-sm btn-outline-secondary" @click="showAISearchPanel = false">Fermer</button>
      </div>
      <div class="ai-body">
        <div class="ai-note mb-3">
          Exemple : « Je me trouve à l’Estuaire et je souhaite acheter 2 boîtes d’Efferalgan. »
        </div>
        <div class="input-group input-group-sm">
          <button
            class="btn btn-outline-secondary"
            type="button"
            v-if="supportsSpeech"
            :class="{ 'btn-danger': isTranscribing }"
            :aria-pressed="isTranscribing ? 'true' : 'false'"
            :disabled="aiIsParsing"
            @click="toggleTranscription()"
            title="Transcription vocale gratuite"
          >
            <i :class="isTranscribing ? 'bi bi-stop-circle' : 'bi bi-mic'" style="font-size: 1rem;"></i>
            <span class="ms-1 d-none d-md-inline">{{ isTranscribing ? 'Stop' : 'Transcrire' }}</span>
          </button>
          <button
            class="btn btn-outline-secondary"
            type="button"
            v-else
            disabled
            title="La transcription vocale n'est pas supportée par ce navigateur"
          >
            <i class="bi bi-mic-mute"></i>
          </button>
          <input
            type="text"
            class="form-control ai-input"
            placeholder="Décrivez votre besoin (produit, ville, quantité)..."
            v-model="aiText"
            :disabled="aiIsParsing"
            @keydown.enter.prevent="runAiSearch()"
          />
          <button class="btn ai-send" type="button" :disabled="!aiText.trim() || aiIsParsing" @click="runAiSearch()">
            <span v-if="!aiIsParsing">Rechercher</span>
            <span v-else>Analyse…</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url('../assets/base.css');

:root {
  --primary-color: #0F7ABB;
  --secondary-color: #3AB24F;
  --accent-color: #FF6B6B;
  --dark-color: #2C3E50;
  --light-bg: #F8FAFC;
  --gradient-primary: linear-gradient(135deg, #0F7ABB 0%, #3AB24F 100%);
  --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --shadow-soft: 0 10px 25px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  background: var(--light-bg);
  overflow-x: hidden;
  color: #000;
}

/* Navbar moderne */
.modern-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: all 0.3s ease;
}

/* Hero Section avec animation */
.hero-section {
  min-height: 75vh;
  background: linear-gradient(135deg, rgba(15, 122, 187, 0.9), rgba(58, 178, 79, 0.8)),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1.5" fill="rgba(255,255,255,0.08)"/><circle cx="50" cy="10" r="0.8" fill="rgba(255,255,255,0.12)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  background-size: cover;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 70%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    transform: translateX(-100%);
  }

  50% {
    transform: translateX(100%);
  }
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  padding: 8px 20px;
  color: white;
  font-weight: 600;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: #fff !important;
  margin-bottom: 20px;
  text-shadow: none;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #fff !important;
  margin-bottom: 30px;
  max-width: 600px;
  text-align: justify;
}

/* Empêcher le passage en colonne des boutons */
.hero-actions {
  flex-wrap: nowrap;
}

.hero-actions .btn {
  white-space: nowrap;
}

.btn-modern {
  background: var(--gradient-primary);
  border: none;
  border-radius: 50px;
  padding: 15px 40px;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn-modern:hover::before {
  left: 100%;
}

.btn-modern:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

/* Provinces slider moderne */
.provinces-section {
  background: white;
  padding: 20px 0;
  box-shadow: var(--shadow-soft);
}

.province-scroll {
  display: flex;
  animation: scroll 20s linear infinite;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.province-item {
  display: flex;
  align-items: center;
  background: var(--gradient-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  margin: 0 10px;
  white-space: nowrap;
  min-width: 200px;
  justify-content: center;
  font-weight: 600;
  box-shadow: var(--shadow-soft);
}

/* Search section moderne */
.search-section {
  padding: 50px 0 80px 0;
  background: var(--light-bg);
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 20px 96px 20px 20px;
  border: none;
  border-radius: 50px;
  background: white;
  box-shadow: var(--shadow-soft);
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.search-loader {
  position: absolute;
  right: 110px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.hourglass-spinner {
  width: 24px;
  height: 24px;
  position: relative;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  border-radius: 4px;
  animation: hourglass-rotate 1.2s ease-in-out infinite;
}

/* Variante plus grande pour l'affichage dans la grille produits */
.hourglass-spinner.large {
  width: 48px;
  height: 48px;
}

/* Image loader (SVG) animation */
.hourglass-img {
  width: 64px;
  height: 64px;
  animation: hourglass-spin 1.2s linear infinite;
  filter: drop-shadow(0 6px 18px rgba(15,122,187,0.25));
}

@keyframes hourglass-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.06); }
  100% { transform: rotate(360deg) scale(1); }
}

.hourglass-spinner:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: hourglass-sand 1.2s ease-in-out infinite;
}

@keyframes hourglass-rotate {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
}

@keyframes hourglass-sand {
  0% { 
    opacity: 0;
    transform: translate(-50%, -80%) scale(0.3);
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% { 
    opacity: 0;
    transform: translate(-50%, -20%) scale(0.3);
  }
}

.ring-loader {
  position: relative;
  width: 84px;
  height: 84px;
}
.ring-text {
  margin-top: 10px;
  text-align: center;
  font-weight: 700;
  color: #0F7ABB;
  letter-spacing: 2px;
}
.ring-seg {
  position: absolute;
  inset: 0;
  transform: rotate(calc((var(--i) - 1) * 30deg));
}
.ring-seg::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 50%;
  width: 14px;
  height: 30px;
  margin-left: -7px;
  border-radius: 10px;
  background: linear-gradient(45deg, #22c55e 0%, #0ea5e9 100%);
  opacity: 0.25;
  transform-origin: center 38px;
  animation: ring-pulse 1.2s linear infinite;
  animation-delay: calc((var(--i) - 12) * 0.1s);
}

@keyframes ring-pulse {

  0% { opacity: .25; transform: translateY(6px) scale(.85); }
  50% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: .25; transform: translateY(6px) scale(.85); }
}

.hourglass-gray {
  width: 80px;
  height: 80px;
  animation: hourglass-flip 1.4s ease-in-out infinite;
  filter: drop-shadow(0 6px 18px rgba(0,0,0,0.12));
}

@keyframes hourglass-flip {
  0% { transform: rotate(0deg) scale(1); opacity: 0.85; }
  50% { transform: rotate(180deg) scale(1.03); opacity: 1; }
  100% { transform: rotate(360deg) scale(1); opacity: 0.85; }
}

.products-loader {
  min-height: 220px; /* crée une zone suffisante pour centrer verticalement */
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(15, 122, 187, 0.3), var(--shadow-hover);
  transform: scale(1.02);
}

.search-actions {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  box-shadow: none;
}
.icon-btn:hover { background: rgba(15, 122, 187, 0.08); }

/* AI Search Panel (chat-like, centered) */
.ai-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; }
.ai-panel { width: 560px; max-width: 94vw; max-height: 78vh; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 20px 50px rgba(0,0,0,.25); display: flex; flex-direction: column; }
.ai-header { display:flex; align-items:center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,.08); background: #f8fafc; }
.ai-body { padding: 14px; overflow: auto; }
.ai-note { color: #4b5563; background: #f8fafc; border: 1px solid rgba(0,0,0,.06); padding: 8px 10px; border-radius: 8px; font-size: .9rem; }
.ai-input { border-radius: 999px 0 0 999px; }
.ai-send { border-radius: 0 999px 999px 0; background: var(--gradient-primary); color: #fff; border: none; }
.ai-send:hover { box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4); }
.ai-send:focus { outline: none; box-shadow: 0 0 0 0.2rem rgba(15,122,187,.25); }

@media (max-width: 480px) {
  .ai-panel { width: 100%; max-height: 86vh; }
}

/* Cards modernes pour les produits */
.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: all 0.3s ease;
  height: 100%;
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-hover);
}

.product-card:hover::before {
  opacity: 1;
}

.product-image {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.product-image img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.1);
}

.product-info {
  padding: 25px;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dark-color);
  margin-bottom: 15px;
  min-height: 50px;
  display: flex;
  align-items: center;
}

.prescription-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.prescription-required {
  background: rgba(255, 107, 107, 0.1);
  color: var(--accent-color);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.prescription-not-required {
  background: rgba(58, 178, 79, 0.1);
  color: var(--secondary-color);
  border: 1px solid rgba(58, 178, 79, 0.3);
}

.btn-verify {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-verify:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4);
}

/* Amélioration de l'espacement pour la grille de produits */
#productsGrid {
  margin-top: 2rem;
}

#productsGrid .col-lg-3,
#productsGrid .col-md-6,
#productsGrid .col-sm-12 {
  margin-bottom: 2rem;
}

.search-section .row {
  justify-content: center;
}

/* Partners section */
.partners-section {
  background: white;
  padding: 80px 0;
  border-radius: 30px;
  margin: 40px 0;
  box-shadow: var(--shadow-soft);
}

.partner-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 20px;
  transition: all 0.3s ease;
}

.partner-logo:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-hover);
}

/* Statistics avec animations */
.stats-section {
  background: var(--gradient-secondary);
  padding: 80px 0;
  color: white;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 14px; /* petites cases */
  text-align: center;
  transition: all 0.3s ease;
  height: 120px; /* petites cases */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
}

.stat-number {
  font-size: 2rem; /* plus compact */
  font-weight: 800;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 0.9rem; /* plus compact */
  opacity: 0.9;
}

/* Disposer les cartes en petites cases visibles sans scroll (retour à la ligne) */
.stats-section .row {
  display: flex;
  flex-wrap: wrap; /* wrap par défaut pour petits écrans */
  gap: 0; /* utiliser uniquement les gutters Bootstrap (g-4) pour éviter le dépassement */
  overflow-x: visible; /* pas de scroll horizontal */
}

.stats-section .row> [class^='col-'],
.stats-section .row> [class*=' col-'] {
  flex: 0 0 auto; /* conserver la largeur fixe des petites cases */
  min-width: 150px; /* légèrement réduit pour tenir à 5 par ligne */
  max-width: 170px;
}

/* Sur écrans larges: garder toutes les cartes sur une seule ligne sans scroll */
@media (min-width: 992px) {
  .stats-section .row {
    flex-wrap: nowrap;
  }
}

/* Contact section moderne */
.contact-section {
  padding: 80px 0;
  background: var(--light-bg);
}

.contact-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: var(--shadow-soft);
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.contact-icon {
  width: 80px;
  height: 80px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 2rem;
}

.contact-form {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-soft);
}

.form-floating {
  margin-bottom: 20px;
}

.form-control {
  border: 2px solid transparent;
  border-radius: 15px;
  padding: 15px;
  background: var(--light-bg);
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(15, 122, 187, 0.1);
  background: white;
}

/* Animations d'entrée */
.fade-in-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Neutraliser les textes grisés pour qu'ils soient noirs et opaques */
.text-muted { color: #000 !important; opacity: 1 !important; }

/* Responsive */
@media (max-width: 992px) {
  .mobile-menu-btn i {
    color: #000 !important;
    font-weight: 700;
    background: transparent !important;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .product-card {
    margin-bottom: 1.5rem;
  }

  .product-title {
    font-size: 1rem;
    min-height: 40px;
  }

  .product-info {
    padding: 20px;
  }

  .stat-card {
    margin-bottom: 20px;
  }

  /* Center hero text and image on mobile */
  .hero-content {
    text-align: center;
  }

  /* Garder les boutons alignés horizontalement en responsive */
  .hero-actions {
    flex-direction: row !important;
    justify-content: center;
    gap: 12px;
    flex-wrap: nowrap !important;
  }

  .hero-actions .btn {
    margin-left: 0 !important;
  }

  /* Descendre le contenu sous la navbar fixe et centrer la section */
  .hero-section {
    padding-top: 90px;
  }

  .hero-section .container {
    margin-left: 0 !important;
  }

  /* Réduire l'espace entre les boutons et l'image utilisateur en mobile */
  .hero-subtitle {
    margin-bottom: 16px; /* moins d'espace sous le texte */
  }

  .hero-actions {
    margin-bottom: 8px; /* rapprocher davantage de l'image */
  }

  .hero-user-img {
    padding-left: 0 !important;
    margin-left: 0 !important;
    max-width: 70%;
    margin-top: 8px !important; /* annule le margin-top inline important */
    padding-top: 0 !important;  /* annule le pt-5 sur le conteneur */
  }

  /* Smaller buttons on mobile */
  .btn-modern {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}

/* Très petits écrans: garder le bouton menu visible et éviter le débordement */
@media (max-width: 576px) {
  .modern-navbar .container {
    margin-left: 0 !important;
    padding-left: 12px;
    padding-right: 12px;
  }

  .mobile-menu-btn {
    display: inline-flex !important;
    position: absolute;
    right: 12px;
    top: 8px;
    z-index: 1101;
    background: transparent;
  }

  .mobile-menu-btn i {
    color: #000 !important;
    font-size: 28px;
    background: transparent !important;
  }

  /* Réduire légèrement le logo pour éviter le chevauchement avec le bouton */
  .modern-navbar .d-flex.align-items-center img {
    width: 80px;
  }
}

/* Effet de parallaxe subtil */
.parallax-bg {
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.credit-badge {
  background: linear-gradient(145deg, #FFD700, #FFA500);
  border-radius: 30px;
  padding: 0.75rem 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.credit-badge::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD);
  background-size: 400% 400%;
  border-radius: 30px;
  z-index: -1;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {

  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.credit-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
}

.credit-badge .icon {
  color: #2d3748;
  font-size: 1rem;
}

.credit-badge .text {
  color: #2d3748;
  font-weight: 700;
  font-size: 1rem;
}

/* Mobile menu overlay and sidebar */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
}

.mobile-sidebar {
  width: 80%;
  max-width: 320px;
  height: 100%;
  background: #fff;
  box-shadow: var(--shadow-hover);
  padding: 16px;
  display: flex;
  flex-direction: column;
  animation: slideIn .2s ease-out;
}

.mobile-credits {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

@keyframes slideIn {
  from { transform: translateX(20px); opacity: .6; }
  to { transform: translateX(0); opacity: 1; }
}

/* AI Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.modal-card {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.25);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.06);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,.08);
  background: #f8fafc;
}
.modal-title { font-weight: 600; color: #0F7ABB; }
.modal-body { padding: 14px; }
.modal-footer { padding: 12px 14px; border-top: 1px solid rgba(0,0,0,.08); background: #fff; }
.btn-close { background: transparent; border: 0; font-size: 1.1rem; }

/* List aesthetics for candidates */
.list-group-item { border: 1px solid rgba(0,0,0,.08); margin-bottom: 6px; border-radius: 10px; }
.list-group-item:hover { background: #f8fafc; }
</style>
