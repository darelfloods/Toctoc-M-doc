<template>
  <div>
    <button class="chatbot-fab" @click="open = !open">
      <i class="bi bi-robot"></i>
    </button>

    <div v-if="open" class="chatbot-panel shadow">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
        <strong>Chatbot</strong>
        <button class="btn btn-sm btn-outline-secondary" @click="open=false">Fermer</button>
      </div>
      <div class="p-3 chat-messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="text-muted small">
          Besoin d'aide ? Sélectionnez une question rapide ci-dessous.
        </div>
        <transition-group v-else name="msg" tag="div" class="d-flex flex-column gap-2">
          <div v-for="m in messages" :key="m.id" class="chat-row">
            <div class="bubble bot" v-if="m.role==='bot'" v-html="m.text"></div>
            <div class="bubble user" v-else v-html="m.text"></div>
          </div>
          <div v-if="isTyping" key="__typing" class="chat-row">
            <div class="bubble bot typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </transition-group>
      </div>
      <div class="p-2 border-top footer-area">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill quick-toggle" @click="showQuick = !showQuick">
              <i class="bi bi-lightning-charge me-1"></i> Aide rapide
            </button>
          </div>
          <div>
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill" title="Effacer la conversation" @click="clearMessages()">
              <i class="bi bi-trash me-1"></i> Effacer
            </button>
          </div>
        </div>
        <!-- Floating Quick Questions Popover -->
        <div v-if="showQuick" class="quick-popover">
          <!-- Header with close button -->
          <div class="popover-header">
            <div class="popover-title">
              <i :class="currentCategory.icon" class="header-icon"></i>
              <span>{{ currentCategory.name }}</span>
            </div>
            <button type="button" class="btn-close-popover" @click="showQuick = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Category navigation tabs -->
          <div class="category-tabs">
            <button
              v-for="(cat, idx) in categories"
              :key="cat.id"
              type="button"
              class="category-tab"
              :class="{ active: idx === currentCategoryIndex }"
              @click="goToCategory(idx)"
              :style="{ '--tab-color': cat.color }"
            >
              <i :class="cat.icon" class="tab-icon"></i>
              <span class="tab-label">{{ cat.name }}</span>
            </button>
          </div>

          <!-- Questions grid -->
          <div class="questions-container">
            <transition name="fade" mode="out-in">
              <div :key="currentCategoryIndex" class="quick-grid-modern">
                <button
                  v-for="q in currentQuestions"
                  :key="q.key"
                  type="button"
                  class="quick-chip-modern"
                  @click="answer(q.key); showQuick = false"
                >
                  <i :class="q.icon" class="chip-icon"></i>
                  <span class="chip-label">{{ q.label }}</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- Navigation arrows -->
          <div class="popover-nav">
            <button
              type="button"
              class="nav-arrow"
              :class="{ disabled: currentCategoryIndex === 0 }"
              :disabled="currentCategoryIndex === 0"
              @click="prevCategory"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="nav-indicator">
              {{ currentCategoryIndex + 1 }} / {{ categories.length }}
            </div>
            <button
              type="button"
              class="nav-arrow"
              :class="{ disabled: currentCategoryIndex === categories.length - 1 }"
              :disabled="currentCategoryIndex === categories.length - 1"
              @click="nextCategory"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="input-group input-group-sm">
          <input
            type="text"
            class="form-control"
            placeholder="Tapez votre message…"
            aria-label="Message"
            v-model="messageText"
            @keydown.enter.prevent="sendMessage()"
          />
          <button
            v-if="supportsSpeech"
            class="btn btn-mic"
            type="button"
            :class="{ 'btn-recording': isTranscribing, 'btn-listening': isListening }"
            :title="isTranscribing ? 'Arrêter l\'enregistrement' : 'Reconnaissance vocale'"
            @click="toggleTranscription()"
          >
            <i :class="isTranscribing ? 'bi bi-stop-circle' : 'bi bi-mic'"></i>
            <span v-if="isListening" class="listening-pulse"></span>
          </button>
          <button class="btn btn-primary btn-send" type="button" :disabled="!messageText.trim()" @click="sendMessage()">
            <i class="bi bi-send"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
const open = ref(false)

type Role = 'user' | 'bot'
type Message = { id: number; role: Role; text: string }

const messages = ref<Message[]>([])
const showQuick = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const messageText = ref('')
const isTyping = ref(false)

// Pagination for quick questions
const currentCategoryIndex = ref(0)
const categories = [
  { id: 'account', name: 'Compte', icon: 'bi-person-circle', color: '#8b5cf6' },
  { id: 'search', name: 'Recherche', icon: 'bi-search', color: '#3b82f6' },
  { id: 'orders', name: 'Commandes', icon: 'bi-bag-check', color: '#10b981' },
  { id: 'pharmacy', name: 'Pharmacies', icon: 'bi-hospital', color: '#ef4444' },
  { id: 'payment', name: 'Crédits', icon: 'bi-credit-card-2-front', color: '#f59e0b' },
  { id: 'help', name: 'Aide', icon: 'bi-question-circle', color: '#6366f1' },
]

// Voice recognition (Web Speech API) - Chatbot instance
const isTranscribing = ref(false)
const isListening = ref(false) // Visual indicator for active listening
let chatbotRecognition: any = null
let autoRestartTimeout: any = null
const supportsSpeech = typeof (window as any).SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined'

const quickQuestions = [
  // Compte & Authentification
  { key: 'signup', label: "Comment s'inscrire ?", icon: 'bi bi-person-plus', category: 'account' },
  { key: 'login', label: 'Comment se connecter ?', icon: 'bi bi-box-arrow-in-right', category: 'account' },
  { key: 'profile', label: 'Modifier mon profil', icon: 'bi bi-person-gear', category: 'account' },
  { key: 'password', label: 'Changer mon mot de passe', icon: 'bi bi-key', category: 'account' },
  { key: 'logout', label: 'Comment me déconnecter ?', icon: 'bi bi-box-arrow-right', category: 'account' },

  // Recherche & Navigation
  { key: 'search', label: 'Rechercher un médicament', icon: 'bi bi-search', category: 'search' },
  { key: 'ai-search', label: 'Recherche intelligente (IA)', icon: 'bi bi-stars', category: 'search' },
  { key: 'filter', label: 'Filtrer par province', icon: 'bi bi-geo-alt', category: 'search' },
  { key: 'details', label: 'Voir détails produit', icon: 'bi bi-info-circle', category: 'search' },

  // Réservations & Commandes
  { key: 'reserve', label: 'Faire une réservation', icon: 'bi bi-calendar-check', category: 'orders' },
  { key: 'cart', label: 'Gérer mon panier', icon: 'bi bi-cart3', category: 'orders' },
  { key: 'validate', label: 'Valider une commande', icon: 'bi bi-check-circle', category: 'orders' },
  { key: 'track', label: 'Suivre mes commandes', icon: 'bi bi-truck', category: 'orders' },

  // Pharmacies & Disponibilité
  { key: 'availability', label: 'Vérifier disponibilité', icon: 'bi bi-clipboard-check', category: 'pharmacy' },
  { key: 'pharmacy', label: 'Choisir une pharmacie', icon: 'bi bi-building', category: 'pharmacy' },

  // Crédits & Paiement
  { key: 'credits', label: 'Recharger des crédits', icon: 'bi bi-wallet2', category: 'payment' },
  { key: 'what-credits', label: 'Que sont les crédits ?', icon: 'bi bi-question-circle', category: 'payment' },

  // Support & Aide
  { key: 'support', label: 'Contacter le support', icon: 'bi bi-headset', category: 'help' },
  { key: 'about', label: 'À propos d\'E-Pharma', icon: 'bi bi-info-square', category: 'help' },
]

// Wakeup ping when user opens chatbot
let hasSentChatbotPing = false
watch(open, (isOpen) => {
  if (isOpen && !hasSentChatbotPing) {
    hasSentChatbotPing = true
    // Utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
    const webhookUrl = '/n8n-webhook/webhook/8e3590f6-96f5-4761-98f3-a487f882b066'

    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '__chatbot_wakeup__', source: 'chatbot-open' })
    }).catch(() => {
      console.log('[Chatbot] Wakeup ping sent on chatbot open')
    })
  }
})

function answer(key: string) {
  const content = getAnswer(key)
  if (content) {
    messages.value.push({ id: Date.now(), role: 'bot', text: content })
    showQuick.value = false
    nextTick(() => {
      const el = messagesEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
}

function clearMessages() {
  messages.value = []
  showQuick.value = false
}

// Pagination functions
const currentCategory = computed(() => categories[currentCategoryIndex.value])
const currentQuestions = computed(() => quickQuestions.filter(q => q.category === currentCategory.value.id))

function nextCategory() {
  if (currentCategoryIndex.value < categories.length - 1) {
    currentCategoryIndex.value++
  }
}

function prevCategory() {
  if (currentCategoryIndex.value > 0) {
    currentCategoryIndex.value--
  }
}

function goToCategory(index: number) {
  currentCategoryIndex.value = index
}

function escapeHtml(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatBotResponse(text: string): string {
  // Si c'est déjà du HTML structuré (contient des balises), on le retourne tel quel
  if (text.includes('<div') || text.includes('<ol') || text.includes('<ul')) {
    return text
  }

  // Sinon, on applique le formatage automatique pour du texte brut
  let formatted = text

  // 1. Remplacer les **texte** par <strong>texte</strong>
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 2. Mettre en gras les mots-clés importants (boutons, actions, UI)
  const keywords = [
    'Recherche Intelligente', 'Panier', 'Paramètres', 'Magasin de crédits', 'Crédits',
    'Se connecter', 'S\'inscrire', 'Connexion', 'Déconnexion',
    'Airtel Money', 'Mobi Cash', 'Payer', 'Valider', 'Confirmer',
    'Vérifier la disponibilité', 'Ajouter au panier', 'Réserver',
    'Nom d\'utilisateur', 'Mot de passe', 'Email', 'Adresse mail'
  ]

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi')
    formatted = formatted.replace(regex, '<strong class="text-primary">$1</strong>')
  })

  // 3. Ajouter <br> après les deux-points suivis d'un retour à ligne
  formatted = formatted.replace(/:\s*\n/g, ':<br>')

  // 4. Gérer les listes avec tirets ou numéros
  const lines = formatted.split('\n')
  let inList = false
  let listType = 'ul' // 'ul' ou 'ol'
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Détecter une ligne de liste avec tiret ou puce
    const bulletMatch = line.match(/^[-•]\s*(.+)/)
    const numberMatch = line.match(/^(\d+)[.)]\s*(.+)/)

    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<ul class="bot-list mb-2 ps-3">')
        inList = true
        listType = 'ul'
      } else if (listType === 'ol') {
        processedLines.push('</ol>')
        processedLines.push('<ul class="bot-list mb-2 ps-3">')
        listType = 'ul'
      }
      processedLines.push(`<li>${bulletMatch[1]}</li>`)
    } else if (numberMatch) {
      if (!inList) {
        processedLines.push('<ol class="bot-list-numbered mb-2 ps-3">')
        inList = true
        listType = 'ol'
      } else if (listType === 'ul') {
        processedLines.push('</ul>')
        processedLines.push('<ol class="bot-list-numbered mb-2 ps-3">')
        listType = 'ol'
      }
      processedLines.push(`<li>${numberMatch[2]}</li>`)
    } else {
      // Ligne normale
      if (inList) {
        processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
      }
      if (line) {
        processedLines.push(line + '<br>')
      }
    }
  }

  // Fermer la liste si elle est encore ouverte
  if (inList) {
    processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
  }

  formatted = processedLines.join('')

  // 5. Mettre en évidence les emojis et symboles spéciaux
  formatted = formatted.replace(/(💡|⚠️|✅|❌|🔍|💳|🛒|⭐|👋|🔧)/g, '<span class="emoji-highlight">$1</span>')

  // 6. Nettoyer les <br> multiples
  formatted = formatted.replace(/(<br>\s*){3,}/g, '<br><br>')

  // 7. Wrapper dans une div pour l'affichage
  formatted = `<div class="bot-formatted-response">${formatted}</div>`

  return formatted
}

async function sendMessage() {
  const text = messageText.value.trim()
  if (!text) return
  // Push user message
  messages.value.push({ id: Date.now(), role: 'user', text: escapeHtml(text) })
  messageText.value = ''
  nextTick(() => {
    const el = messagesEl.value
    if (el) el.scrollTop = el.scrollHeight
  })

  // Decide if this is a quick-intent (local answer) or a free-text (send to webhook)
  const t = text.toLowerCase()
  const isQuickIntent = (
    t.includes('inscri') ||
    t.includes('connect') || t.includes('login') ||
    t.includes('réserv') || t.includes('reserv') ||
    t.includes('crédit') || t.includes('credit')
  )

  // If quick intent: answer locally (no webhook)
  if (isQuickIntent) {
    isTyping.value = true
    await new Promise(r => setTimeout(r, 450))
    const reply = buildBotReply(text)
    isTyping.value = false
    messages.value.push({ id: Date.now(), role: 'bot', text: reply })
    nextTick(() => {
      const el = messagesEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
    return
  }

  // Free-text: POST to n8n webhook - utiliser le proxy Vercel en prod et le proxy Vite en dev pour contourner CORS
  const webhookUrl = '/n8n-webhook/webhook/8e3590f6-96f5-4761-98f3-a487f882b066'
  isTyping.value = true
  let botText: string | null = null

  // Timeout configuration
  const timeoutMs = 60000 // 60 seconds for hosted n8n with AI processing + cold start
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // Show "waking up service" message after 5 seconds
  let slowResponseWarning: number | null = null
  const warningMsgId = Date.now() + 99999 // Unique ID for warning message
  slowResponseWarning = window.setTimeout(() => {
    messages.value.push({
      id: warningMsgId,
      role: 'bot',
      text: '⏳ Le service IA démarre... Cela peut prendre jusqu\'à 30 secondes (service gratuit).'
    })
    nextTick(() => {
      if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    })
  }, 5000)

  try {
    console.log('[Chatbot] 📤 Sending to webhook:', text)

    // Simple payload format
    const payload = {
      message: text,
      text: text,
      source: 'chatbot'
    }

    console.log('[Chatbot] 📦 Payload:', payload)

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    if (slowResponseWarning) clearTimeout(slowResponseWarning)

    if (res && res.ok) {
      console.log('[Chatbot] ✅ Webhook status OK:', res.status)
      const rawText = await res.text().catch(() => '')
      console.log('[Chatbot] 📄 Raw response:', rawText)

      if (!rawText || !rawText.trim()) {
        console.warn('[Chatbot] ⚠️ Empty response from webhook - using test response')
        // Webhook.site retourne vide, on simule une réponse
        botText = formatBotResponse(
          "**Pour gérer votre panier:**\n\n" +
          "1. **Ajouter un produit** - Recherchez un médicament et cliquez sur 'Ajouter au panier'\n" +
          "2. **Voir le panier** - Cliquez sur l'icône panier en haut à droite\n" +
          "3. **Modifier les quantités** - Utilisez les boutons + et - dans le panier\n" +
          "4. **Supprimer un article** - Cliquez sur l'icône poubelle\n" +
          "5. **Valider la commande** - Cliquez sur 'Commander' une fois prêt\n\n" +
          "Besoin d'aide supplémentaire ?"
        )
      } else {
        // Try to parse as JSON
        try {
          const data = JSON.parse(rawText)
          console.log('[Chatbot] 📊 Parsed JSON response:', data)
          // Try multiple common shapes
          const keys = [
            'reply','text','message','output','output_text','content','answer','result','response'
          ] as const
          for (const k of keys) {
            const v = (data as any)?.[k]
            if (typeof v === 'string' && v.trim()) {
              botText = formatBotResponse(v) // Format the response
              console.log(`[Chatbot] 🎯 Found response in field '${k}':`, v.substring(0, 100))
              break
            }
          }
          // Nested shapes
          if (!botText) {
            const nested = (data as any)?.choices?.[0]?.message?.content ||
                          (data as any)?.data?.reply ||
                          (data as any)?.data?.text
            if (typeof nested === 'string' && nested.trim()) {
              botText = formatBotResponse(nested) // Format the response
              console.log('[Chatbot] 🎯 Found response in nested field:', nested.substring(0, 100))
            }
          }
          // If no field matched, use raw text
          if (!botText && rawText.trim()) {
            botText = formatBotResponse(rawText) // Format the response
            console.log('[Chatbot] 📝 Using raw JSON text as response')
          }
        } catch (e) {
          console.warn('[Chatbot] ⚠️ Not JSON, using raw text:', e)
          if (rawText.trim()) {
            botText = formatBotResponse(rawText) // Format the response
            console.log('[Chatbot] 📝 Using raw text as response')
          }
        }
      }
    } else {
      console.warn('[Chatbot] ❌ Webhook request failed, status:', res?.status)
    }
  } catch (e) {
    console.warn('[Chatbot] Webhook send error:', e)
  } finally {
    if (slowResponseWarning) clearTimeout(slowResponseWarning)
    // Remove warning message if it was shown
    messages.value = messages.value.filter(m => m.id !== warningMsgId)
  }
  // Small typing delay for UX then show either webhook reply or acknowledgement
  await new Promise(r => setTimeout(r, 450))
  isTyping.value = false
  messages.value.push({
    id: Date.now(),
    role: 'bot',
    text: botText || `Votre message a été transmis. Réponse reçue vide ou non lisible.`,
  })
  nextTick(() => {
    const el = messagesEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function buildBotReply(text: string): string {
  const t = text.toLowerCase()
  // Very light intent hints redirecting to quick answers
  if (t.includes('inscri')) return getAnswer('signup') || friendlyFallback()
  if (t.includes('connect') || t.includes('login')) return getAnswer('login') || friendlyFallback()
  if (t.includes('réserv') || t.includes('reserv')) return getAnswer('reserve') || friendlyFallback()
  if (t.includes('crédit') || t.includes('credit')) return getAnswer('credits') || friendlyFallback()
  return friendlyFallback(text)
}

function friendlyFallback(query?: string): string {
  const q = query ? `<div class="small text-muted mb-2">Vous avez demandé : “${escapeHtml(query)}”</div>` : ''
  return `
    <div>
      ${q}
      <div class="answer-title mb-1">Voici comment je peux vous aider</div>
      <div class="note small mb-2">Je suis encore en apprentissage. Essayez une question précise (ex : "Comment réserver ?"), ou utilisez les questions rapides ci-dessous.</div>
      <div class="d-flex flex-wrap gap-2">
        <span class="chip">S'inscrire</span>
        <span class="chip">Se connecter</span>
        <span class="chip">Réserver</span>
        <span class="chip">Recharger des crédits</span>
      </div>
    </div>
  `
}

// Voice recognition functions - Chatbot isolated instance
function startTranscription() {
  if (!supportsSpeech || isTranscribing.value) return

  // Clear any pending auto-restart
  if (autoRestartTimeout) {
    clearTimeout(autoRestartTimeout)
    autoRestartTimeout = null
  }

  // Stop any existing recognition first
  if (chatbotRecognition) {
    try {
      chatbotRecognition.stop()
    } catch {}
    chatbotRecognition = null
  }

  try {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    chatbotRecognition = new SR()

    // Enhanced configuration for better recognition
    chatbotRecognition.lang = 'fr-FR'
    chatbotRecognition.interimResults = true
    chatbotRecognition.maxAlternatives = 3 // Consider multiple alternatives
    chatbotRecognition.continuous = true // Keep listening continuously

    let fullTranscript = ''
    let lastSpeechTime = Date.now()
    const SILENCE_TIMEOUT = 2000 // Stop after 2 seconds of silence

    chatbotRecognition.onstart = () => {
      console.log('[Chatbot STT] Started listening')
      isListening.value = true
    }

    chatbotRecognition.onspeechstart = () => {
      console.log('[Chatbot STT] Speech detected')
      lastSpeechTime = Date.now()
      isListening.value = true
    }

    chatbotRecognition.onspeechend = () => {
      console.log('[Chatbot STT] Speech ended')
      isListening.value = false
    }

    chatbotRecognition.onresult = (event: any) => {
      lastSpeechTime = Date.now()
      let interimTranscript = ''

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          fullTranscript += transcript + ' '
          console.log('[Chatbot STT] Final:', transcript)
        } else {
          interimTranscript += transcript
          console.log('[Chatbot STT] Interim:', transcript)
        }
      }

      // Update UI with full + interim
      const display = (fullTranscript + interimTranscript).trim()
      messageText.value = display

      // Auto-stop after silence
      if (autoRestartTimeout) clearTimeout(autoRestartTimeout)
      autoRestartTimeout = setTimeout(() => {
        if (Date.now() - lastSpeechTime >= SILENCE_TIMEOUT && isTranscribing.value) {
          console.log('[Chatbot STT] Silence detected, stopping')
          stopTranscription()
        }
      }, SILENCE_TIMEOUT)
    }

    chatbotRecognition.onerror = (e: any) => {
      console.warn('[Chatbot STT] error:', e.error, e)

      // Don't stop on common errors, try to recover
      if (e.error === 'no-speech' || e.error === 'audio-capture') {
        console.log('[Chatbot STT] Recoverable error, continuing...')
        return
      }

      // Only stop on fatal errors
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        console.error('[Chatbot STT] Permission denied')
        isTranscribing.value = false
        isListening.value = false
        chatbotRecognition = null
      }
    }

    chatbotRecognition.onend = () => {
      console.log('[Chatbot STT] Recognition ended')
      isListening.value = false

      // Only auto-restart if still supposed to be transcribing
      if (isTranscribing.value && fullTranscript.trim()) {
        // Had speech, stopped naturally - don't restart
        isTranscribing.value = false
        chatbotRecognition = null
        if (autoRestartTimeout) clearTimeout(autoRestartTimeout)
      } else if (isTranscribing.value) {
        // Stopped without speech - might be an error, try restart
        console.log('[Chatbot STT] Auto-restarting...')
        setTimeout(() => {
          if (isTranscribing.value && chatbotRecognition) {
            try {
              chatbotRecognition.start()
            } catch (e) {
              console.warn('[Chatbot STT] Restart failed:', e)
              isTranscribing.value = false
              chatbotRecognition = null
            }
          }
        }, 100)
      }
    }

    chatbotRecognition.start()
    isTranscribing.value = true
    fullTranscript = '' // Reset on new session
  } catch (e) {
    console.warn('[Chatbot STT] failed to start:', e)
    isTranscribing.value = false
    isListening.value = false
    chatbotRecognition = null
  }
}

function stopTranscription() {
  console.log('[Chatbot STT] Stopping transcription')
  try {
    if (autoRestartTimeout) {
      clearTimeout(autoRestartTimeout)
      autoRestartTimeout = null
    }
    if (chatbotRecognition) {
      chatbotRecognition.stop()
    }
  } catch (e) {
    console.warn('[Chatbot STT] stop error:', e)
  } finally {
    isTranscribing.value = false
    isListening.value = false
    chatbotRecognition = null
  }
}

function toggleTranscription() {
  if (!supportsSpeech) return
  if (isTranscribing.value) stopTranscription()
  else startTranscription()
}

function getAnswer(key: string): string | null {
  switch (key) {
    case 'signup':
      return `
      <div>
        <div class="answer-title mb-1">S'inscrire</div>
        <ol class="step-list mb-2 ps-3">
          <li>Depuis la page d'accueil, cliquez sur <span class="chip">Se connecter</span> dans la barre du haut.</li>
          <li>Dans la fenêtre Connexion, cliquez sur <span class="chip chip-primary">S'inscrire</span>.</li>
          <li>Remplissez le formulaire : <strong>Nom d'utilisateur</strong>, <strong>Adresse mail</strong>, <strong>Mot de passe</strong> et <strong>Confirmez votre mot de passe</strong>.</li>
          <li>Cliquez sur <span class="chip chip-primary">S'inscrire</span>. Un message confirme la réussite.</li>
        </ol>
        <div class="note small">Astuce : vous pouvez revenir à la connexion via le lien « Se connecter » en bas du formulaire.</div>
      </div>`
    case 'login':
      return `
      <div>
        <div class="answer-title mb-1">Se connecter</div>
        <ol class="step-list mb-2 ps-3">
          <li>Cliquez sur <span class="chip">Se connecter</span> dans la barre du haut.</li>
          <li>Dans la fenêtre Connexion, saisissez votre <strong>Nom d'utilisateur</strong> et votre <strong>Mot de passe</strong>.</li>
          <li>Utilisez l'icône <i class="bi bi-eye"></i> pour afficher/masquer le mot de passe si besoin.</li>
          <li>Cliquez sur <span class="chip chip-primary">Connexion</span>. Un message confirme la réussite.</li>
        </ol>
        <div class="note small">Pas de compte ? Cliquez sur <span class="chip chip-primary">S'inscrire</span> depuis la fenêtre de connexion.</div>
      </div>`
    case 'reserve':
      return `
      <div>
        <div class="answer-title mb-1">Faire une réservation</div>
        <ol class="step-list mb-2 ps-3">
          <li>Recherchez un médicament puis ouvrez la disponibilité. Si besoin, sélectionnez une <strong>province</strong> et une <strong>pharmacie</strong>.</li>
          <li>Dans la fenêtre de réservation, ajustez la <strong>Quantité</strong>.</li>
          <li>Vérifiez le <strong>Total</strong>, puis cliquez sur <span class="chip chip-primary">Confirmer l'ajout</span>.</li>
          <li>La réservation est ajoutée à votre panier.</li>
        </ol>
        <div class="note small">Remarque : l'accès aux pharmacies peut débiter 1 crédit. Si votre solde est insuffisant, le magasin de crédits s'ouvrira.</div>
      </div>`
    case 'credits':
      return `
      <div>
        <div class="answer-title mb-1">Recharger des crédits</div>
        <ol class="step-list mb-2 ps-3">
          <li>Cliquez sur le <span class="chip">X crédits</span> dans la barre du haut ou ouvrez <span class="chip">Paramètres</span> puis <span class="chip">Magasin de crédits</span>.</li>
          <li>Choisissez une <span class="chip">offre</span> puis cliquez sur <span class="chip chip-primary">Acheter</span>.</li>
          <li>Confirmez, puis dans la fenêtre Paiement, sélectionnez une méthode (<span class="chip">Airtel Money</span> ou <span class="chip">Mobi Cash</span>), renseignez votre <strong>numéro</strong> et cliquez sur <span class="chip chip-primary">Valider</span>.</li>
          <li>Saisissez votre mot de passe mobile money sur votre téléphone, puis attendez la validation.</li>
        </ol>
        <div class="note small">Après validation, votre solde se met à jour automatiquement.</div>
      </div>`
    case 'profile':
      return `<div>
        <div class="answer-title mb-1">Modifier mon profil</div>
        <ol class="step-list mb-2 ps-3">
          <li>Connectez-vous à votre compte.</li>
          <li>Cliquez sur <span class="chip">Paramètres</span> (icône engrenage) dans la barre du haut.</li>
          <li>Sélectionnez <span class="chip chip-primary">Modifier mon profil</span>.</li>
          <li>Modifiez vos informations : <strong>Nom</strong>, <strong>Email</strong>, <strong>Téléphone</strong>.</li>
          <li>Cliquez sur <span class="chip chip-primary">Enregistrer</span> pour sauvegarder vos modifications.</li>
        </ol>
        <div class="note small">Note : certaines modifications peuvent nécessiter une reconnexion.</div>
      </div>`
    case 'password':
      return `<div>
        <div class="answer-title mb-1">Changer mon mot de passe</div>
        <ol class="step-list mb-2 ps-3">
          <li>Connectez-vous à votre compte.</li>
          <li>Cliquez sur <span class="chip">Paramètres</span> puis <span class="chip chip-primary">Changer mot de passe</span>.</li>
          <li>Saisissez votre <strong>Ancien mot de passe</strong>.</li>
          <li>Entrez votre <strong>Nouveau mot de passe</strong> (min. 8 caractères).</li>
          <li>Confirmez le nouveau mot de passe et cliquez sur <span class="chip chip-primary">Modifier</span>.</li>
        </ol>
        <div class="note small">Mot de passe oublié ? Utilisez "Mot de passe oublié" sur la page de connexion.</div>
      </div>`
    case 'logout':
      return `<div>
        <div class="answer-title mb-1">Comment me déconnecter ?</div>
        <ol class="step-list mb-2 ps-3">
          <li>Cliquez sur <span class="chip">Paramètres</span> (icône engrenage) en haut à droite.</li>
          <li>Sélectionnez <span class="chip chip-primary">Déconnexion</span> en bas du menu.</li>
          <li>Confirmez la déconnexion si demandé.</li>
          <li>Vous serez redirigé vers la page d'accueil.</li>
        </ol>
        <div class="note small">Vos données de panier sont sauvegardées et disponibles à votre prochaine connexion.</div>
      </div>`
    case 'search':
      return `<div>
        <div class="answer-title mb-1">Rechercher un médicament</div>
        <ol class="step-list mb-2 ps-3">
          <li>Sur la page d'accueil, utilisez la <strong>barre de recherche</strong> en haut.</li>
          <li>Tapez le nom du médicament (ex: "Doliprane", "Paracétamol").</li>
          <li>Les résultats apparaissent automatiquement pendant que vous tapez.</li>
          <li>Cliquez sur un produit pour voir ses détails et disponibilités.</li>
        </ol>
        <div class="note small">Astuce : la recherche fonctionne avec les noms commerciaux et les principes actifs.</div>
      </div>`
    case 'ai-search':
      return `<div>
        <div class="answer-title mb-1">Recherche intelligente (IA)</div>
        <ol class="step-list mb-2 ps-3">
          <li>Cliquez sur l'icône <span class="chip">✨ Recherche Intelligente</span> dans la barre de recherche.</li>
          <li>Décrivez votre besoin en langage naturel : <em>"Je me situe à l'Estuaire et je souhaite acheter 2 boîtes d'EFFERALGAN"</em></li>
          <li>Utilisez le bouton <strong>microphone</strong> pour dicter votre recherche.</li>
          <li>L'IA trouve automatiquement le produit, la pharmacie et ajoute au panier.</li>
        </ol>
        <div class="note small">⚠️ Cette fonctionnalité consomme 1 crédit par recherche.</div>
      </div>`
    case 'filter':
      return `<div>
        <div class="answer-title mb-1">Filtrer par province</div>
        <ol class="step-list mb-2 ps-3">
          <li>Après avoir recherché un médicament, cliquez sur <span class="chip chip-primary">Vérifier la disponibilité</span>.</li>
          <li>Dans la fenêtre Disponibilité, sélectionnez votre <strong>Province</strong> dans le menu déroulant.</li>
          <li>Les pharmacies de votre province s'affichent avec le stock disponible.</li>
          <li>Choisissez une pharmacie et ajoutez au panier.</li>
        </ol>
        <div class="note small">Provinces disponibles : Estuaire, Haut-Ogooué, Moyen-Ogooué, Ngounié, Nyanga, Ogooué-Ivindo, Ogooué-Lolo, Ogooué-Maritime, Woleu-Ntem.</div>
      </div>`
    case 'details':
      return `<div>
        <div class="answer-title mb-1">Voir les détails d'un produit</div>
        <ol class="step-list mb-2 ps-3">
          <li>Depuis les résultats de recherche, cliquez sur la <strong>carte du produit</strong>.</li>
          <li>Consultez : <strong>Nom</strong>, <strong>Dosage</strong>, <strong>Présentation</strong>, <strong>Prix</strong>.</li>
          <li>Cliquez sur <span class="chip chip-primary">Vérifier la disponibilité</span> pour voir les pharmacies.</li>
        </ol>
        <div class="note small">Tous les prix affichés sont TTC (Toutes Taxes Comprises).</div>
      </div>`
    case 'cart':
      return `<div>
        <div class="answer-title mb-1">Gérer mon panier</div>
        <ol class="step-list mb-2 ps-3">
          <li>Cliquez sur l'icône <span class="chip">🛒 Panier</span> en haut à droite.</li>
          <li>Consultez vos réservations : <strong>Produit</strong>, <strong>Pharmacie</strong>, <strong>Quantité</strong>, <strong>Prix</strong>.</li>
          <li>Utilisez les boutons <strong>+</strong> et <strong>-</strong> pour modifier les quantités.</li>
          <li>Cliquez sur l'icône <strong>🗑️</strong> pour supprimer un article.</li>
          <li>Le total se met à jour automatiquement.</li>
        </ol>
        <div class="note small">Votre panier est sauvegardé même après déconnexion.</div>
      </div>`
    case 'validate':
      return `<div>
        <div class="answer-title mb-1">Valider une commande</div>
        <ol class="step-list mb-2 ps-3">
          <li>Ouvrez votre <span class="chip">Panier</span> et vérifiez vos articles.</li>
          <li>Cliquez sur <span class="chip chip-primary">Commander</span> en bas du panier.</li>
          <li>Vérifiez les informations de retrait : <strong>Pharmacie</strong>, <strong>Adresse</strong>.</li>
          <li>Confirmez la commande.</li>
          <li>Vous recevrez un <strong>SMS de confirmation</strong> avec les détails.</li>
        </ol>
        <div class="note small">Vous avez 48h pour retirer votre commande en pharmacie.</div>
      </div>`
    case 'track':
      return `<div>
        <div class="answer-title mb-1">Suivre mes commandes</div>
        <ol class="step-list mb-2 ps-3">
          <li>Connectez-vous à votre compte.</li>
          <li>Cliquez sur <span class="chip">Paramètres</span> puis <span class="chip chip-primary">Mes commandes</span>.</li>
          <li>Consultez l'historique : <strong>Date</strong>, <strong>Statut</strong>, <strong>Pharmacie</strong>, <strong>Montant</strong>.</li>
          <li>Cliquez sur une commande pour voir les détails.</li>
        </ol>
        <div class="note small">Statuts possibles : En attente, Prête, Retirée, Annulée.</div>
      </div>`
    case 'availability':
      return `<div>
        <div class="answer-title mb-1">Vérifier la disponibilité</div>
        <ol class="step-list mb-2 ps-3">
          <li>Sélectionnez un produit depuis la recherche.</li>
          <li>Cliquez sur <span class="chip chip-primary">Vérifier la disponibilité</span>.</li>
          <li>Choisissez votre <strong>Province</strong> dans le menu déroulant.</li>
          <li>La liste des pharmacies avec le stock disponible s'affiche.</li>
          <li>Le stock est indiqué en temps réel pour chaque pharmacie.</li>
        </ol>
        <div class="note small">⚠️ Cette vérification consomme 1 crédit par recherche.</div>
      </div>`
    case 'pharmacy':
      return `<div>
        <div class="answer-title mb-1">Choisir une pharmacie</div>
        <ol class="step-list mb-2 ps-3">
          <li>Après avoir vérifié la disponibilité, consultez la liste des pharmacies.</li>
          <li>Pour chaque pharmacie, vous voyez : <strong>Nom</strong>, <strong>Adresse</strong>, <strong>Stock disponible</strong>.</li>
          <li>Cliquez sur la pharmacie de votre choix.</li>
          <li>Ajustez la quantité et ajoutez au panier.</li>
        </ol>
        <div class="note small">Conseil : choisissez une pharmacie proche de chez vous pour faciliter le retrait.</div>
      </div>`
    case 'what-credits':
      return `<div>
        <div class="answer-title mb-1">Que sont les crédits ?</div>
        <div class="mb-2">Les crédits sont la monnaie virtuelle d'E-Pharma qui vous permet d'accéder à certaines fonctionnalités premium :</div>
        <ul class="bot-list mb-2 ps-3">
          <li><strong>Vérification de disponibilité</strong> : 1 crédit par recherche</li>
          <li><strong>Recherche intelligente (IA)</strong> : 1 crédit par recherche</li>
          <li><strong>Accès aux pharmacies</strong> : consulter le stock en temps réel</li>
        </ul>
        <div class="mb-2"><strong>Offres disponibles :</strong></div>
        <ul class="bot-list mb-2 ps-3">
          <li>Pack Starter : 10 crédits</li>
          <li>Pack Pro : 50 crédits</li>
          <li>Pack Premium : 100 crédits</li>
        </ul>
        <div class="note small">💡 Les crédits n'ont pas de date d'expiration et sont utilisables à tout moment.</div>
      </div>`
    case 'support':
      return `<div>
        <div class="answer-title mb-1">Contacter le support</div>
        <div class="mb-2">Plusieurs moyens de nous contacter :</div>
        <ul class="bot-list mb-2 ps-3">
          <li><strong>📧 Email</strong> : contact@e-pharma.ga</li>
          <li><strong>📱 WhatsApp</strong> : +241 XX XX XX XX</li>
          <li><strong>🕐 Horaires</strong> : Lun-Ven 8h-18h, Sam 9h-13h</li>
          <li><strong>📍 Adresse</strong> : Coworking SING SA Bureau 2, Rue Pecqueur, Centre-Ville, Libreville</li>
        </ul>
        <div class="note small">Notre équipe vous répond sous 24h maximum.</div>
      </div>`
    case 'about':
      return `<div>
        <div class="answer-title mb-1">À propos d'E-Pharma</div>
        <div class="mb-2">E-Pharma est la première plateforme de réservation de médicaments en ligne au Gabon.</div>
        <div class="mb-2"><strong>Notre mission :</strong></div>
        <ul class="bot-list mb-2 ps-3">
          <li>Faciliter l'accès aux médicaments</li>
          <li>Vérifier la disponibilité en temps réel</li>
          <li>Gagner du temps avec la réservation en ligne</li>
          <li>Garantir la qualité et l'authenticité des produits</li>
        </ul>
        <div class="mb-2"><strong>🏆 Nos atouts :</strong></div>
        <ul class="bot-list mb-2 ps-3">
          <li>Réseau de + de 50 pharmacies partenaires</li>
          <li>Stock en temps réel</li>
          <li>Recherche intelligente par IA</li>
          <li>Paiement mobile sécurisé</li>
        </ul>
        <div class="note small">Développé avec ❤️ par l'équipe E-Pharma</div>
      </div>`
    default:
      return null
  }
}
</script>

<style scoped>
 .chatbot-fab { position: fixed; right: 20px; bottom: 20px; width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-primary); color: #fff; border: none; display:flex; align-items:center; justify-content:center; font-size: 1.5rem; z-index: 1000; box-shadow: 0 10px 24px rgba(0,0,0,.18); transition: transform .15s ease, box-shadow .2s ease, background-color .2s ease; }
 .chatbot-fab:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4); background: var(--gradient-primary); }
 .chatbot-fab:focus { outline: none; box-shadow: 0 0 0 0.25rem rgba(15,122,187,.25); }

 .chatbot-panel { position: fixed; right: 20px; bottom: 90px; width: 350px; max-width: calc(100vw - 40px); background: #fff; border-radius: 12px; overflow: hidden; z-index: 1000; border: 1px solid rgba(0,0,0,.06); }
 .chat-messages { height: 330px; overflow: auto; background: #fff; border: 1px solid rgba(0,0,0,.06); border-radius: 8px; }
 .chat-row { display: flex; }
 .bubble { max-width: 100%; padding: 10px 12px; border-radius: 12px; font-size: .925rem; line-height: 1.35; }
  .bubble.bot { background: #fff; color: #111827; border: 1px solid rgba(0,0,0,.12); }
  .bubble.user { background: #0F7ABB; color: #fff; margin-left: auto; }

 /* Smooth message entrance */
 .msg-enter-from { opacity: 0; transform: translateY(6px); }
 .msg-enter-active { transition: all .18s ease-out; }
 .msg-enter-to { opacity: 1; transform: translateY(0); }

 /* Typing indicator */
 .typing { display: inline-flex; gap: 4px; align-items: center; }
 .dot { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; opacity: .6; animation: blink 1.2s infinite ease-in-out; }
 .dot:nth-child(2) { animation-delay: .15s; }
 .dot:nth-child(3) { animation-delay: .3s; }
 @keyframes blink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: .9 } }

 /* Round input + button */
 .input-group > .form-control { border-radius: 999px 0 0 999px; }
 .input-group > .btn-mic { border-radius: 0; border-left: none; border-right: none; }
 .input-group > .btn-send { border-radius: 0 999px 999px 0; }
 .btn-send i { vertical-align: middle; }

 /* Microphone button */
 .btn-mic {
   background: #fff;
   border: 1px solid #ced4da;
   color: #6c757d;
   padding: 0.375rem 0.75rem;
   transition: all 0.15s ease;
 }
 .btn-mic:hover {
   background: #f8f9fa;
   color: #0F7ABB;
   border-color: #0F7ABB;
 }
 .btn-mic.btn-recording {
   background: #dc3545;
   color: #fff;
   border-color: #dc3545;
   animation: pulse-recording 1.5s ease-in-out infinite;
   position: relative;
 }
 .btn-mic.btn-recording:hover {
   background: #c82333;
   border-color: #bd2130;
 }
 .btn-mic.btn-listening {
   background: #28a745 !important;
   border-color: #28a745 !important;
 }
 @keyframes pulse-recording {
   0%, 100% { opacity: 1; }
   50% { opacity: 0.7; }
 }

 /* Listening pulse indicator */
 .listening-pulse {
   position: absolute;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   width: 100%;
   height: 100%;
   border-radius: 50%;
   border: 2px solid rgba(255, 255, 255, 0.8);
   animation: pulse-wave 1.5s ease-out infinite;
   pointer-events: none;
 }
 @keyframes pulse-wave {
   0% {
     transform: translate(-50%, -50%) scale(0.8);
     opacity: 1;
   }
   100% {
     transform: translate(-50%, -50%) scale(1.5);
     opacity: 0;
   }
 }

 /* Quick questions - Modern Redesign */
 .footer-area { position: relative; }
 .quick-popover {
   position: absolute;
   left: 8px;
   right: 8px;
   bottom: 44px;
   max-height: min(480px, calc(100vh - 200px));
   background: #fff;
   border: 1px solid rgba(0,0,0,.08);
   border-radius: 16px;
   box-shadow: 0 12px 40px rgba(0,0,0,.18);
   z-index: 5;
   overflow: hidden;
   display: flex;
   flex-direction: column;
   animation: popoverSlideUp 0.3s ease-out;
 }

 @keyframes popoverSlideUp {
   from { opacity: 0; transform: translateY(10px); }
   to { opacity: 1; transform: translateY(0); }
 }

 /* Popover Header */
 .popover-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 14px 16px;
   background: linear-gradient(135deg, #0F7ABB 0%, #1e88c9 100%);
   color: #fff;
   box-shadow: 0 2px 8px rgba(0,0,0,.1);
   flex-shrink: 0;
 }

 .popover-title {
   display: flex;
   align-items: center;
   gap: 10px;
   font-weight: 600;
   font-size: 1rem;
 }

 .header-icon {
   font-size: 1.3rem;
   opacity: 0.95;
 }

 .btn-close-popover {
   background: rgba(255, 255, 255, 0.2);
   border: none;
   color: #fff;
   width: 30px;
   height: 30px;
   border-radius: 8px;
   display: flex;
   align-items: center;
   justify-content: center;
   cursor: pointer;
   transition: all 0.2s ease;
   font-size: .85rem;
 }

 .btn-close-popover:hover {
   background: rgba(255, 255, 255, 0.3);
   transform: rotate(90deg);
 }

 /* Category Tabs - Professional Design */
 .category-tabs {
   display: grid;
   grid-template-columns: repeat(3, 1fr);
   gap: 8px;
   padding: 12px;
   background: #fff;
   border-bottom: 1px solid rgba(0,0,0,.08);
   flex-shrink: 0;
 }

 .category-tab {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 4px;
   background: #f8fafc;
   border: 1.5px solid #e5e7eb;
   padding: 10px 8px;
   border-radius: 10px;
   cursor: pointer;
   transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
   position: relative;
   overflow: hidden;
 }

 .category-tab::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 3px;
   background: var(--tab-color);
   transform: scaleX(0);
   transition: transform 0.3s ease;
 }

 .category-tab:hover::before {
   transform: scaleX(1);
 }

 .category-tab:hover {
   background: #fff;
   border-color: var(--tab-color);
   box-shadow: 0 2px 8px rgba(0,0,0,.08);
   transform: translateY(-2px);
 }

 .category-tab.active {
   background: #fff;
   border-color: var(--tab-color);
   box-shadow: 0 3px 12px rgba(0,0,0,.12);
 }

 .category-tab.active::before {
   transform: scaleX(1);
 }

 .category-tab.active .tab-icon {
   color: var(--tab-color);
   transform: scale(1.1);
 }

 .category-tab.active .tab-label {
   color: var(--tab-color);
   font-weight: 600;
 }

 .tab-icon {
   font-size: 1.2rem;
   color: #6b7280;
   transition: all 0.2s ease;
 }

 .tab-label {
   font-size: .75rem;
   color: #6b7280;
   font-weight: 500;
   transition: all 0.2s ease;
   text-align: center;
 }

 /* Questions Container */
 .questions-container {
   padding: 14px;
   min-height: 180px;
   flex: 1;
   overflow-y: auto;
   overflow-x: hidden;
 }

 .quick-grid-modern {
   display: grid;
   grid-template-columns: repeat(2, 1fr);
   gap: 8px;
 }

 .quick-chip-modern {
   display: flex;
   align-items: center;
   gap: 8px;
   padding: 12px 14px;
   background: #fff;
   border: 1.5px solid rgba(0,0,0,.1);
   border-radius: 12px;
   cursor: pointer;
   transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
   text-align: left;
 }

 .quick-chip-modern:hover {
   background: linear-gradient(135deg, #0F7ABB 0%, #1e88c9 100%);
   border-color: #0F7ABB;
   color: #fff;
   box-shadow: 0 4px 12px rgba(15, 122, 187, 0.3);
   transform: translateY(-2px);
 }

 .quick-chip-modern:active {
   transform: translateY(0);
 }

 .chip-icon {
   font-size: 1.1rem;
   flex-shrink: 0;
 }

 .chip-label {
   font-size: .85rem;
   font-weight: 500;
   line-height: 1.3;
 }

 /* Fade transition for category change */
 .fade-enter-active, .fade-leave-active {
   transition: opacity 0.2s ease;
 }
 .fade-enter-from, .fade-leave-to {
   opacity: 0;
 }

 /* Navigation Arrows */
 .popover-nav {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 10px 14px;
   background: #f8fafc;
   border-top: 1px solid rgba(0,0,0,.06);
   flex-shrink: 0;
 }

 .nav-arrow {
   background: #fff;
   border: 1px solid rgba(0,0,0,.12);
   width: 36px;
   height: 36px;
   border-radius: 50%;
   display: flex;
   align-items: center;
   justify-content: center;
   cursor: pointer;
   transition: all 0.2s ease;
   font-size: 1rem;
   color: #374151;
 }

 .nav-arrow:hover:not(.disabled) {
   background: linear-gradient(135deg, #0F7ABB 0%, #1e88c9 100%);
   border-color: #0F7ABB;
   color: #fff;
   box-shadow: 0 2px 8px rgba(15, 122, 187, 0.3);
 }

 .nav-arrow.disabled {
   opacity: 0.3;
   cursor: not-allowed;
 }

 .nav-indicator {
   font-size: .85rem;
   font-weight: 600;
   color: #6b7280;
 }

 .quick-toggle { padding: 4px 10px; background: var(--gradient-primary); color: #fff; border: none; }
 .quick-toggle:hover { box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4); }
 .quick-toggle:focus { outline: none; box-shadow: 0 0 0 0.2rem rgba(15,122,187,.25); }

 /* Mobile optimizations for iPhone 11 and similar (375px-414px) */
 @media (max-width: 480px) {
   .chatbot-panel {
     right: 10px;
     bottom: 80px;
     width: calc(100vw - 20px);
     max-height: 70vh;
   }

   .chat-messages {
     height: 280px;
   }

   .bubble {
     font-size: .875rem;
     padding: 8px 10px;
     max-width: 85%;
   }

   .quick-popover {
     left: 4px;
     right: 4px;
     max-height: min(400px, calc(100vh - 180px));
   }

   .quick-grid-modern {
     grid-template-columns: 1fr;
     gap: 6px;
   }

   .quick-chip-modern {
     padding: 10px 12px;
     font-size: .8rem;
   }

   .category-tabs {
     grid-template-columns: repeat(2, 1fr);
     gap: 6px;
     padding: 10px;
   }

   .category-tab {
     padding: 8px 6px;
   }

   .tab-label {
     font-size: .7rem;
   }

   .tab-icon {
     font-size: 1rem;
   }

   .popover-header {
     padding: 10px 12px;
   }

   .popover-title {
     font-size: .9rem;
   }

   .header-icon {
     font-size: 1.1rem;
   }

   .btn-close-popover {
     width: 26px;
     height: 26px;
   }

   .questions-container {
     padding: 10px;
   }

   .input-group {
     flex-wrap: nowrap;
   }

   .input-group > .form-control {
     font-size: .875rem;
   }

   .btn-mic, .btn-send {
     padding: 0.5rem;
   }
 }

 @media (max-width: 380px) {
   .chatbot-panel {
     right: 5px;
     width: calc(100vw - 10px);
   }

   .quick-grid-modern { grid-template-columns: 1fr; }
   .category-tabs { grid-template-columns: repeat(2, 1fr); }
   .tab-label { font-size: .65rem; }
   .popover-header { padding: 8px 10px; }
   .popover-title { font-size: .85rem; }
 }

 /* Consistent styling for answer content */
 .answer-title { font-weight: 600 !important; color: #0F7ABB !important; }
 .step-list { counter-reset: step; }
 .step-list > li { margin-bottom: 6px; }
 .note { color: #4b5563; background: #f8fafc; border: 1px solid rgba(0,0,0,.06); padding: 6px 10px; border-radius: 8px; }
 .chip { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; border: 1px solid rgba(15,122,187,.25); background: rgba(15,122,187,.06); color: #0F7ABB; font-weight: 500; }
 .chip-primary { background: #0F7ABB; color: #fff; border-color: #0F7ABB; }

 /* Harmonise primary buttons with verify gradient */
 .quick-toggle,
 .btn-send {
   background: var(--gradient-primary) !important;
   color: #fff !important;
   border: none !important;
   box-shadow: none;
 }
 .quick-toggle:hover,
 .btn-send:hover { box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4); }
 .quick-toggle:focus,
 .btn-send:focus { outline: none; box-shadow: 0 0 0 0.2rem rgba(15,122,187,.25); }

 /* Bot formatted response styles */
 .bot-formatted-response {
   line-height: 1.6;
 }
 .bot-formatted-response .text-primary {
   color: #0F7ABB !important;
   font-weight: 600;
 }
 .bot-list,
 .bot-list-numbered {
   margin: 8px 0;
   padding-left: 1.5rem;
 }
 .bot-list-numbered {
   counter-reset: item;
   list-style: none;
 }
 .bot-list-numbered > li {
   counter-increment: item;
   margin-bottom: 6px;
 }
 .bot-list-numbered > li::before {
   content: counter(item) ". ";
   color: #0F7ABB;
   font-weight: 600;
   margin-right: 6px;
 }
 .bot-list > li {
   margin-bottom: 6px;
 }
 .bot-list > li::marker {
   color: #0F7ABB;
 }
 .emoji-highlight {
   font-size: 1.1em;
   margin-right: 4px;
 }
</style>
