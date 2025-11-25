<template>
  <header class="navbar-wrap surface-section">
    <div class="navbar-inner px-3 py-2">
      <!-- Logo -->
      <img :src="logoUrl" alt="Logo" style="height:40px" />

      <!-- Greeting centered -->
      <div class="center-slot hidden md:flex">
        <div v-if="greetingVisible" class="greeting typing" aria-live="polite">
          {{ displayedText }}
        </div>
      </div>

      <!-- Menu + Actions -->
      <div class="actions">
        <!-- Menu principal (visible en desktop) -->
        <div class="hidden md:flex gap-4">
          <Button label="Accueil" text />
          <Button label="Produits" text />
          <Button label="Tarifs" text />
          <Button label="Support" text />
        </div>

        <!-- Boutons utilisateur -->
        <div class="hidden md:flex gap-2">
          <template v-if="!auth.isLoggedIn">
            <Button label="Se connecter" size="small" outlined />
            <Button label="Créer un compte" size="small" />
          </template>
          <template v-else>
            <Button :label="`Bonjour, ${userName}`" size="small" text />
            <Button label="Se déconnecter" size="small" severity="secondary" @click="onLogout" />
          </template>
        </div>

        <!-- Bouton Pharmacies (avant les autres icônes) -->
        <!--<Button
          icon="pi pi-building"
          label="Pharmacies"
          class="ml-2"
          text
          @click="showPharmaciesModal = true"
        />-->

        <!-- Ici tu peux ajouter les boutons Paramètre et Panier si besoin -->
        <!--
        <Button icon="pi pi-cog" class="ml-2" text />
        <Button icon="pi pi-shopping-cart" class="ml-2" text />
        -->

        <!-- Hamburger (mobile uniquement) -->
        <Button
          class="md:hidden"
          icon="pi pi-bars"
          text
          @click="mobileOpen = true"
          aria-label="Ouvrir le menu"
        />
      </div>
    </div>

    <!-- Sidebar mobile -->
    <Sidebar v-model:visible="mobileOpen" position="left" class="w-18rem">
      <div class="flex align-items-center gap-2 mb-3">
        <img :src="logoUrl" alt="Logo" style="height:30px" />
        <span class="font-semibold">TOC TOC MEDOC</span>
      </div>
      <Menu :model="items" />
      <div class="mt-4 flex flex-column gap-2">
        <template v-if="!auth.isLoggedIn">
          <Button label="Se connecter" outlined />
          <Button label="Créer un compte" />
        </template>
        <template v-else>
          <Button :label="`Bonjour, ${userName}`" text />
          <Button label="Se déconnecter" severity="secondary" @click="() => { onLogout(); mobileOpen = false }" />
        </template>
      </div>
    </Sidebar>
  </header>
  <!-- Mobile credit badge (visible when hamburger is the nav) -->
  <div class="md:hidden mobile-credit-badge">
    <span class="label">Crédit:</span>
    <span class="value">{{ credit.credits }}</span>
  </div>

  <!-- Modal Pharmacies -->
  <Dialog v-model:visible="showPharmaciesModal" header="Liste des pharmacies" :modal="true" :closable="true" :style="{ width: '350px' }">
    <ul style="list-style:none;padding:0;">
      <li v-for="pharma in pharmaciesList" :key="pharma" class="mb-2">
        <i class="pi pi-building mr-2"></i> {{ pharma }}
      </li>
    </ul>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Menu from 'primevue/menu'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useAuthStore } from '@/stores/auth'
import { AuthService } from '@/Services/AuthService'
import { useCreditStore } from '@/stores/credit'

import logoUrl from '@/assets/logo.svg'

const mobileOpen = ref(false)
const showPharmaciesModal = ref(false)

const pharmaciesList = [
  "AYITEBE",
  "AKEWA",
  "SOS BIBIKI",
  "MARIE LAMLET",
  "LIBWE",
  "EL RAPHA",
  "MANIEVA"
]

const auth = useAuthStore()
const credit = useCreditStore()

// Typing animation state
const displayedText = ref('')
const typingIndex = ref(0)
const typingSpeed = 40 // ms per character
let typingTimer: number | undefined

const userName = computed(() => auth.currentUser?.name || 'Cher utilisateur')
const fullText = computed(() => `Bienvenue sur TocToc Médoc ${userName.value}`)
const greetingVisible = computed(() => !!fullText.value?.length)

function startTyping() {
  // reset
  displayedText.value = ''
  typingIndex.value = 0
  if (typingTimer) window.clearInterval(typingTimer)
  typingTimer = window.setInterval(() => {
    if (typingIndex.value < fullText.value.length) {
      displayedText.value += fullText.value.charAt(typingIndex.value)
      typingIndex.value += 1
    } else {
      if (typingTimer) window.clearInterval(typingTimer)
    }
  }, typingSpeed)
}

onMounted(() => {
  startTyping()
  // Refresh credits for current user on mount (mobile badge uses it)
  credit.refreshForCurrentUser()

  // Debug: afficher les crédits toutes les 2 secondes
  setInterval(() => {
    console.log('🔍 [NAVBAR] Crédits affichés:', credit.credits)
  }, 2000)
})

watch(fullText, () => {
  startTyping()
})

const items = [
  { label: 'Accueil', icon: 'pi pi-home', route: '/' },
  {
    label: 'Produits', icon: 'pi pi-box',
    items: [
      { label: 'Nouveautés', icon: 'pi pi-star' },
      { label: 'Catalogue', icon: 'pi pi-list' }
    ]
  },
  { label: 'Tarifs', icon: 'pi pi-tags' },
  { label: 'Support', icon: 'pi pi-life-ring' }
]

async function onLogout() {
  try {
    await AuthService.logout()
  } catch (e) {
    console.error('Erreur lors de la déconnexion', e)
  }
}
</script>

<style scoped>
.navbar-wrap {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
}

.navbar-inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  width: 100%;
  column-gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.center-slot {
  display: flex;
  justify-self: center;
  justify-content: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-self: end;
}

.greeting {
  font-weight: 600;
  font-size: 1rem;
  color: #0F7ABB;
  background: linear-gradient(90deg, #0F7ABB, #3AB24F);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(15, 122, 187, 0.15);
  white-space: nowrap;
  max-width: 100%;
}

.typing {
  border-right: 2px solid rgba(15,122,187,0.8);
  padding-right: 6px;
  animation: caret 0.9s steps(1) infinite;
}

@keyframes caret {
  50% { border-color: transparent; }
}

/* Mobile credit badge bottom-left */
.mobile-credit-badge {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 1100;
  background: #0F7ABB;
  color: #fff;
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(15,122,187,0.25);
  display: flex;
  align-items: center;
  gap: 6px;
}
.mobile-credit-badge .label { opacity: 0.9; font-weight: 500; }
.mobile-credit-badge .value { font-weight: 700; }
</style>
