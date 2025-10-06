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
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-semibold">Questions rapides</div>
            <button type="button" class="btn btn-sm btn-light" @click="showQuick = false">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="quick-grid">
            <button v-for="q in quickQuestions" :key="q.key" type="button" class="quick-chip" @click="answer(q.key)">
              <i :class="q.icon" class="me-1"></i>
              <span>{{ q.label }}</span>
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
          <button class="btn btn-primary btn-send" type="button" :disabled="!messageText.trim()" @click="sendMessage()">
            <i class="bi bi-send"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
const open = ref(false)

type Role = 'user' | 'bot'
type Message = { id: number; role: Role; text: string }

const messages = ref<Message[]>([])
const showQuick = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const messageText = ref('')
const isTyping = ref(false)

const quickQuestions = [
  { key: 'signup', label: "Comment s'inscrire ?", icon: 'bi bi-person-plus' },
  { key: 'login', label: 'Comment se connecter ?', icon: 'bi bi-box-arrow-in-right' },
  { key: 'reserve', label: 'Comment faire une réservation ?', icon: 'bi bi-calendar-check' },
  { key: 'credits', label: 'Comment recharger des crédits ?', icon: 'bi bi-wallet2' },
]

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

function escapeHtml(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

  // Free-text: POST to n8n webhook (production)
  const webhookUrl = 'https://n8n-workflows-cktx.onrender.com/webhook/8e3590f6-96f5-4761-98f3-a487f882b066'
  isTyping.value = true
  let botText: string | null = null

  // Timeout configuration
  const timeoutMs = 30000 // 30 seconds for hosted n8n with AI processing
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    console.log('[Chatbot] 📤 Sending to webhook-test:', text)

    // Try multiple payload formats
    const payloads = [
      { prompt: text },
      { message: text },
      { text: text },
      { input: text },
      { query: text },
      { content: text },
      {
        prompt: text,
        message: text,
        text: text,
        source: 'chatbot',
        type: 'chat_request'
      }
    ]

    let res: Response | null = null

    // Try each format until one works
    for (let i = 0; i < payloads.length; i++) {
      try {
        console.log(`[Chatbot] 🔄 Trying payload format ${i + 1}:`, payloads[i])

        const testResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads[i]),
          signal: controller.signal
        })

        if (testResponse.ok) {
          // Check if response has valid content (clone to read without consuming)
          const testText = await testResponse.clone().text()
          console.log(`[Chatbot] 📥 Response ${i + 1} preview (${testText.length} chars):`, testText.substring(0, 200))

          const hasContent = testText && testText.trim()
          const isNotEmpty = testText !== '{}' && testText !== 'null' && testText !== ''
          const hasMinLength = testText.length > 5

          if (hasContent && isNotEmpty && hasMinLength) {
            res = testResponse
            console.log(`[Chatbot] ✅ Payload format ${i + 1} worked! Got ${testText.length} chars`)
            break
          } else {
            console.log(`[Chatbot] ⚠️ Format ${i + 1} response seems empty or invalid`)
          }
        } else {
          console.log(`[Chatbot] ❌ Format ${i + 1} returned status ${testResponse.status}`)
        }
      } catch (e) {
        if ((e as any)?.name === 'AbortError') {
          console.warn(`[Chatbot] ⏰ Format ${i + 1} timed out`)
        } else {
          console.warn(`[Chatbot] ❌ Format ${i + 1} failed:`, e)
        }
      }
    }

    clearTimeout(timeoutId)

    if (res && res.ok) {
      console.log('[Chatbot] ✅ Webhook status OK:', res.status)
      const rawText = await res.text().catch(() => '')
      console.log('[Chatbot] 📄 Raw response:', rawText)

      if (!rawText || !rawText.trim()) {
        console.warn('[Chatbot] ⚠️ Empty response from webhook')
        botText = null
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
              botText = escapeHtml(v)
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
              botText = escapeHtml(nested)
              console.log('[Chatbot] 🎯 Found response in nested field:', nested.substring(0, 100))
            }
          }
          // If no field matched, use raw text
          if (!botText && rawText.trim()) {
            botText = escapeHtml(rawText)
            console.log('[Chatbot] 📝 Using raw JSON text as response')
          }
        } catch (e) {
          console.warn('[Chatbot] ⚠️ Not JSON, using raw text:', e)
          if (rawText.trim()) {
            botText = escapeHtml(rawText)
            console.log('[Chatbot] 📝 Using raw text as response')
          }
        }
      }
    } else {
      console.warn('[Chatbot] ❌ All webhook formats failed or timed out')
    }
  } catch (e) {
    console.warn('[Chatbot] Webhook send error:', e)
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
  .bubble.bot { background: #f8f9fa; color: #111827; border: 1px solid rgba(0,0,0,.06); }
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
 .input-group > .btn { border-radius: 0 999px 999px 0; }
 .btn-send i { vertical-align: middle; }
 /* Quick questions */
 .footer-area { position: relative; }
 .quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
 .quick-chip { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,.12); background: #fff; color: #111827; font-size: .85rem; line-height: 1.2; transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease; }
  .quick-chip:hover { background: #f8f9fa; border-color: rgba(0,0,0,.18); box-shadow: 0 1px 2px rgba(0,0,0,.06); }
  .quick-popover { position: absolute; left: 8px; right: 8px; bottom: 44px; background: #fff; border: 1px solid rgba(0,0,0,.1); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.15); padding: 10px; z-index: 5; }
  .quick-toggle { padding: 4px 10px; background: var(--gradient-primary); color: #fff; border: none; }
  .quick-toggle:hover { box-shadow: 0 5px 15px rgba(15, 122, 187, 0.4); }
  .quick-toggle:focus { outline: none; box-shadow: 0 0 0 0.2rem rgba(15,122,187,.25); }
  @media (max-width: 380px) { .quick-grid { grid-template-columns: 1fr; } }

 /* Consistent styling for answer content */
 .answer-title { font-weight: 600; color: #0F7ABB; }
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
</style>
