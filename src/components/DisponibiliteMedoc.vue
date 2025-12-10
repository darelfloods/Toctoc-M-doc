<template>
  <div v-if="visible">
    <div class="modal fade show" id="medoc" tabindex="-1" aria-labelledby="provincesModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header border-0 modal-header-provinces">
            <button type="button" class="close-btn-provinces" aria-label="Close" @click="$emit('close')">
              <i class="bi bi-x" style="font-size: 24px;"></i>
            </button>
            <div class="img">
              <img src="/assets/Fichier 12.svg" width="150" height="100" alt="">
            </div>
            <h4 class="modal-title-provinces">Vérifiez la disponibilité du médicament par province</h4>
          </div>

          <!-- Scrollable body -->
          <div class="modal-body p-0">
          <div class="provinces-container position-relative">
            <!-- Résumé résultats -->
            <div class="pb-4">
              <div v-if="loading" class="text-center text-muted">
                <i class="bi bi-hourglass" style="font-size: 24px;"></i>
                Recherche en cours...
              </div>

              <div v-else>
                <template v-if="hasAnyData">
                  <div class="results-summary">
                    <h5 class="mb-3 text-primary">
                      <i class="fas fa-chart-bar me-2"></i>
                      Résumé des résultats par province
                    </h5>
                    <div class="row">
                      <div v-for="(list, prov) in groupedPharmacies" :key="prov" class="col-md-4 mb-3">
                        <div class="summary-card">
                          <h6 class="text-success">{{ prov }}</h6>
                          <p class="mb-0">
                            <i class="bi bi-geo" style="font-size: 24px;"></i>
                            {{ list?.length || 0 }} pharmacie(s) disponible(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center text-muted">
                    <i class="bi bi-x" style="font-size: 24px;"></i>
                    Aucune pharmacie disponible pour ce produit.
                  </div>
                </template>
              </div>
            </div>

            <!-- Navigation supprimée pour afficher toutes les provinces -->

            <!-- En-tête section -->
            <div class="provinces-header">
              <h5>Provinces du Gabon</h5>
              <p>Choisissez la province où vous souhaitez rechercher des pharmacies</p>
            </div>

            <!-- Grille provinces - toutes affichées en une fois -->
            <div class="provinces-grid">
              <div v-for="p in provinces" :key="p.key" class="province-card" :class="{ 'selected-province': selectedProvince===p.key }" @click="selectProvince(p.key)">
                <img :src="p.img" :alt="p.key" class="province-image">
                <h6 class="province-name">{{ p.label }}</h6>
                <div class="province-capital">
                  <i class="bi bi-geo" style="font-size: 24px;"></i>
                  <span v-if="loading">Recherche de pharmacies en cours...</span>
                  <span v-else>
                    <template v-if="hasPharmacies(p.key)">
                      <ul class="mb-0 ps-3" style="font-size: 13px;">
                        <li v-for="(addr, idx) in getAddressesFor(p.key)" :key="idx">
                          {{ addr }}
                        </li>
                      </ul>
                    </template>
                    <template v-else>
                      <span class="text-danger">Le produit n'est pas disponible dans cette province</span>
                    </template>
                  </span>
                </div>
                <div class="province-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ (groupedPharmacies[p.key]?.length || 0) }}</span>
                    <span class="stat-label">Pharmacie(s)</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">—</span>
                    <span class="stat-label">Adresse(s)</span>
                  </div>
                </div>
                <button class="select-button">
                  <i class="bi bi-check" style="font-size: 24px;"></i>
                  Sélectionner
                </button>
              </div>
            </div>
          </div>
          </div>

          <!-- Actions -->
          <div class="modal-footer border-0 modal-actions-provinces">
            <div class="selection-info" id="selection-info">
              {{ selectedProvince || 'Aucune province sélectionnée' }}
            </div>
            <div class="action-buttons-provinces">
              <button type="button" class="btn-cancel-provinces" @click="$emit('close')">
                <i class="bi bi-x" style="font-size: 24px;"></i>
                Annuler
              </button>
              <button type="button" class="btn-confirm-provinces " :disabled="!selectedProvince" @click="confirmSelection">
                <i class="bi bi-check" style="font-size: 24px;"></i>
                Confirmer la sélection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
    <!-- Confirmation modal: coût en crédits -->
    <div v-if="showDebitConfirm">
      <div class="modal fade show" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="--bs-modal-width:520px;">
          <div class="modal-content p-4">
            <h5>Confirmation</h5>
            <p>Cette action vaut 2 crédits. Voulez-vous continuer ?</p>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
              <button class="btn-cancel-provinces" @click="cancelConfirm">Annuler</button>
              <button class="btn-confirm-provinces" :disabled="isDebiting" @click="doConfirm">Confirmer</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Grouped = Record<string, any[]>

const props = defineProps<{ visible: boolean; groupedPharmacies: Grouped; loading: boolean }>()
const emit = defineEmits(['close','selectProvince','confirmSelection'])

const provinces = [
  { key: 'Estuaire', label: 'Estuaire (G1)', img: '/assets/Estuaire.png' },
  { key: 'Haut-Ogooué', label: 'Haut-Ogooué (G2)', img: '/assets/Haut-Ogooué.png' },
  { key: 'Moyen-Ogooué', label: 'Moyen-Ogooué (G3)', img: '/assets/Moyen-Ogooué.png' },
  { key: 'Ngounié', label: 'Ngounié (G4)', img: '/assets/Nguounié.png' },
  { key: 'Nyanga', label: 'Nyanga (G5)', img: '/assets/Nyanga.png' },
  { key: 'Ogooué-Ivindo', label: 'Ogooué-Ivindo (G6)', img: '/assets/Ogooué-Invindo.png' },
  { key: 'Ogooué-Lolo', label: 'Ogooué-Lolo (G7)', img: '/assets/Ogooué-Lolo.png' },
  { key: 'Ogooué-Maritime', label: 'Ogooué-Maritime (G8)', img: '/assets/Ogooué-Maritime.png' },
  { key: 'Woleu-Ntem', label: 'Woleu-Ntem (G9)', img: '/assets/Woleu-Ntem.png' },
]

// Pagination supprimée - toutes les provinces affichées en une fois
// const pages = computed(() => [
//   provinces.slice(0,3),
//   provinces.slice(3,6),
//   provinces.slice(6,9),
// ])
// const page = ref(1)
const selectedProvince = ref<string | null>(null)
const showDebitConfirm = ref<boolean>(false)
const isDebiting = ref<boolean>(false)

const hasAnyData = computed(() => Object.keys(props.groupedPharmacies || {}).length > 0)
function hasPharmacies(key: string) {
  const list = props.groupedPharmacies?.[key]
  return !!(list && list.length)
}
function getPharmacieField(ph: any, field: string) {
  return ph?.[field] || ph?.pharmacie?.[field] || ''
}
function getCity(ph: any) {
  return (
    ph?.ville || ph?.city || ph?.localite || ph?.commune ||
    ph?.pharmacie?.ville || ph?.pharmacie?.city || ph?.pharmacie?.localite || ph?.pharmacie?.commune ||
    ph?.adresse || ''
  )
}
function getAddress(ph: any) {
  return (
    ph?.pharmacie?.adresse ||
    ph?.adresse ||
    ph?.pharmacie?.souscription ||
    ph?.souscription ||
    ''
  )
}
function getAddressesFor(key: string) {
  const list = (props.groupedPharmacies?.[key] || []) as any[]
  const seen = new Set<string>()
  const result: string[] = []
  for (const ph of list) {
    const addr = String(getAddress(ph) || '').trim()
    if (addr && !seen.has(addr)) { seen.add(addr); result.push(addr) }
  }
  return result
}
function getCitiesFor(key: string) {
  const list = (props.groupedPharmacies?.[key] || []) as any[]
  const seen = new Set<string>()
  const result: string[] = []
  for (const ph of list) {
    const c = String(getCity(ph) || '').trim()
    if (c && !seen.has(c)) { seen.add(c); result.push(c) }
  }
  return result
}
// Fonctions de pagination supprimées
// function previousPage() { if (page.value > 1) page.value-- }
// function nextPage() { if (page.value < pages.value.length) page.value++ }
function selectProvince(key: string) {
  selectedProvince.value = key
  // Ne plus émettre l'événement selectProvince ici
  // L'événement ne sera émis que lors de la confirmation
}
function confirmSelection() {
  if (selectedProvince.value) {
    // Ouvrir la confirmation indiquant le coût en crédits
    showDebitConfirm.value = true
  }
}

function cancelConfirm() {
  showDebitConfirm.value = false
}

async function doConfirm() {
  if (!selectedProvince.value || isDebiting.value) return
  
  isDebiting.value = true
  try {
    // Importer le store de crédits
    const { useCreditStore } = await import('../stores/credit')
    const creditStore = useCreditStore()
    
    // Débiter 2 crédits via le store
    const ok = await creditStore.debitCredits(2)
    if (!ok) {
      // Échec: garder la modale ouverte et alerter l'utilisateur
      alert('Le débit de crédits a échoué. Vérifiez votre solde ou votre connexion.')
      showDebitConfirm.value = false
      isDebiting.value = false
      return
    }
    
    // Succès: émettre l'événement vers le parent pour ouvrir la sélection de pharmacies
    emit('confirmSelection', selectedProvince.value)
    showDebitConfirm.value = false
  } catch (e) {
    console.error('Erreur lors du débit des crédits:', e)
    alert('Erreur lors du débit des crédits')
    showDebitConfirm.value = false
  } finally {
    isDebiting.value = false
  }
}
</script>

<style scoped>
/* Styles inspirés d'Angular pour parité visuelle */
.modal-content { border-radius: 20px; border: none; box-shadow: 0 30px 60px rgba(0,0,0,.15); overflow: hidden; }
.modal-content { overflow-x: hidden; }
.modal-body { max-height: calc(100vh - 220px); overflow-y: auto; overflow-x: hidden; }
.modal-header-provinces { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; padding:2rem; text-align:center; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.close-btn-provinces { position:absolute; top:20px; right:25px; background:rgba(255,255,255,0.2); border:none; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all .3s ease; backdrop-filter: blur(10px); }
.close-btn-provinces:hover { background:rgba(255,255,255,0.3); transform: rotate(90deg) scale(1.1); }
.modal-title-provinces { font-weight:600; margin-top:.5rem; }
.modal-header-provinces .img { display:flex; justify-content:center; margin-bottom:.25rem; }
.provinces-container { padding:2rem; background: linear-gradient(145deg,#ffffff,#f8fafc); overflow-x: hidden; }
.results-summary .summary-card { background:#fff; border:1px solid rgba(102,126,234,0.15); border-radius:12px; padding:1rem; box-shadow:0 8px 24px rgba(0,0,0,0.06); }
/* Navigation supprimée */
/* .navigation-controls { position:absolute; top:50%; transform: translateY(-50%); z-index:2; }
.nav-left { left:0; }
.nav-right { right:0; }
.nav-btn { width:44px; height:44px; border:none; border-radius:50%; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg,#667eea,#764ba2); color:#fff; box-shadow:0 8px 24px rgba(102,126,234,0.3); }
.nav-btn:disabled { opacity:.4; } */
.provinces-header { text-align:center; margin: 1rem 0 1.5rem; }
.provinces-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; max-width: 100%; }
@media (min-width: 1200px) { .provinces-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 992px) { .provinces-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 576px) { .provinces-grid { grid-template-columns: 1fr; } }
.province-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 8px 24px rgba(0,0,0,0.06); padding:16px; position:relative; overflow:hidden; transition:.2s ease; cursor:pointer; }
.province-card::before { content:''; position:absolute; left:0; top:0; width:4px; height:100%; background: linear-gradient(135deg,#667eea,#764ba2); }
.province-card:hover { transform: translateY(-2px); box-shadow:0 12px 28px rgba(102,126,234,0.2); border-color:#667eea; }
.selected-province { outline: 3px solid rgba(102,126,234,0.6); }
.province-image { width:100%; height:120px; object-fit:contain; margin-bottom:8px; }
.province-name { font-weight:600; color:#2d3748; margin-bottom:8px; }
.province-capital { color:#64748b; font-size:.9rem; min-height:52px; }
.province-stats { display:flex; gap:8px; margin:8px 0; }
.stat-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 8px; text-align:center; }
.stat-number { font-weight:700; color:#667eea; display:block; font-size: .95rem; }
.stat-label { font-size:.7rem; color:#64748b; }
.select-button { background: linear-gradient(135deg,#48bb78,#38a169); border:none; color:#fff; border-radius:12px; padding:10px 14px; width:100%; font-weight:600; box-shadow:0 8px 24px rgba(72,187,120,0.25); }
.modal-actions-provinces { display:flex; align-items:center; justify-content:space-between; padding:1rem 2rem 1.5rem; border-top:1px solid rgba(0,0,0,0.05); background:#fff; }
.selection-info { color:#2d3748; font-weight:600; }
.action-buttons-provinces { display:flex; gap:12px; }
.btn-cancel-provinces { background:transparent; border:2px solid #f56565; color:#f56565; border-radius:10px; padding:8px 16px; font-weight:600; }
.btn-confirm-provinces { background: linear-gradient(135deg,#667eea,#764ba2); border:none; color:#fff; border-radius:10px; padding:8px 16px; font-weight:600; }
/* Responsive amélioré sans navigation */
@media (max-width: 992px) { .provinces-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .provinces-grid { grid-template-columns: 1fr; } }
</style>
