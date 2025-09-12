<template>
  <div v-if="visible">
    <div class="modal fade show" id="para" tabindex="-1" aria-labelledby="stat" aria-hidden="true"
      data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content custom-modal-content d-flex justify-content-center" style="z-index: 1055;">
          <div class="modal-body p-0 fade-in" style="background-color: #ffffff;">
            <button class="close-btn" aria-label="Fermer" @click="$emit('close')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div class="header">
              <div class="logo"><img src="/assets/Fichier 12.svg" width="80" height="80" alt="logo_ttm"></div>
              <h1 class="page-title">Paramètres de mon compte</h1>
              <p class="page-subtitle">Gérez vos informations personnelles et préférences</p>
            </div>

            <div class="content-wrapper">
              <div class="profile-section">
                <div class="profile-avatar">
                  <svg viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                    <path fill-rule="evenodd"
                      d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
                  </svg>
                </div>
                <div class="username">{{ user?.pseudo || user?.username || user?.name || user?.lastname || 'Utilisateur' }}</div>
                <div class="email">{{ user?.email || user?.username || '' }}</div>
              </div>

              <div class="options-grid">
                <div class="option-card edit" @click="$emit('editProfile')">
                  <div class="option-icon">
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M15.502 1.94a.5.5 0 0 1 0 .706L14.040 4.11l-2.122-2.122L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2.12-2.114L4.159 9.676l-.536 3.182 3.182-.536 7.472-7.394z" />
                    </svg>
                  </div>
                  <p class="option-text">Modifier mon profil</p>
                  <p class="option-description">Mettez à jour vos informations personnelles</p>
                </div>

                <div class="option-card shop" @click="$emit('openStore')">
                  <div class="option-icon">
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9V5.5z" />
                      <path
                        d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102z" />
                    </svg>
                  </div>
                  <p class="option-text">Magasin de crédits</p>
                  <p class="option-description">Achetez des crédits pour vos services</p>
                </div>

                <div class="option-card password" @click="$emit('changePassword')">
                  <div class="option-icon">
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    </svg>
                  </div>
                  <p class="option-text">Changer de mot de passe</p>
                  <p class="option-description">Sécurisez votre compte</p>
                </div>

                <div class="option-card logout" @click="logout">
                  <div class="option-icon">
                    <svg viewBox="0 0 16 16">
                      <path fill-rule="evenodd"
                        d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                      <path fill-rule="evenodd"
                        d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                    </svg>
                  </div>
                  <p class="option-text">Déconnexion</p>
                  <p class="option-description">Fermez votre session en toute sécurité</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'logout', 'editProfile', 'openStore', 'changePassword'])
const authStore = useAuthStore()
const user = ref<any>(null)

onMounted(() => {
  user.value = authStore.currentUser
})

function logout() {
  authStore.logout()
  emit('logout')
  emit('close')
}
</script>

<style scoped>
/* Styles clés depuis Angular pour parité visuelle */
.custom-modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 900px;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #718096;
  font-size: 16px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  align-items: start;
}

.profile-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.profile-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  z-index: 2;
}

.profile-avatar svg {
  width: 40px;
  height: 40px;
  fill: white;
}

.username {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.email {
  font-size: 14px;
  opacity: 0.9;
  position: relative;
  z-index: 2;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.option-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.option-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.option-card:hover::before {
  opacity: 0.05;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: var(--card-color, #667eea);
}

.option-card.edit {
  --card-color: #3b82f6;
  --card-color-end: #1d4ed8;
}

.option-card.shop {
  --card-color: #10b981;
  --card-color-end: #059669;
}

.option-card.password {
  --card-color: #f59e0b;
  --card-color-end: #d97706;
}

.option-card.logout {
  --card-color: #ef4444;
  --card-color-end: #dc2626;
}

.option-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
  position: relative;
  z-index: 2;
}

.option-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.option-text {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  position: relative;
  z-index: 2;
}

.option-description {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: white;
  transform: rotate(90deg);
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#para .modal-content {
  border: none;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}
</style>
