<template>
  <div v-if="visible">
    <div class="modal fade show" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog" style="--bs-modal-width: 1100px; --bs-modal-height: 1000px;">
        <div class="modal-content">
          <!-- Header modern, sobre -->
          <div class="modal-header-modern">
            <button type="button" class="close-btn" aria-label="Close" @click="$emit('close')">
              <i class="bi bi-x" style="font-size: 22px;"></i>
            </button>
            <div class="header-main">
              <div class="header-info">
                <img class="pharmacy-icon" :src="productImage" alt="Pharmacie">
                <div>
                  <h4 class="modal-title">Pharmacies — {{ province || 'province non définie' }}</h4>
                  <p class="modal-subtitle">Sélectionnez une ou plusieurs pharmacies pour votre produit</p>
                </div>
              </div>
              <div class="header-actions">
                <div class="searchbar">
                  <i class="bi bi-search"></i>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher par nom, quartier ou contact..."
                    aria-label="Rechercher une pharmacie"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-body p-4">
            <!-- Loading indicator -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <p class="mt-3">Chargement des pharmacies...</p>
            </div>

            <!-- Message si aucune pharmacie -->
            <div v-else-if="!pharmacies || pharmacies.length === 0" class="text-center py-5">
              <i class="bi bi-exclamation" style="font-size: 24px;"></i>
              <h5 class="mt-3">Aucune pharmacie disponible</h5>
              <p class="text-muted">Ce produit n'est pas disponible dans {{ province || 'cette province' }} pour le moment.</p>
            </div>

            <!-- Contenu principal si des pharmacies sont disponibles -->
            <div v-else>
              <!-- Bandeau produit allégé -->
              <div class="product-strip">
                <div class="strip-left">
                  <img class="product-thumb" :src="productImage" alt="Produit" />
                  <div class="strip-info">
                    <span class="product-name">{{ productName }}</span>
                    <span class="product-helper">Produits similaires</span>
                  </div>
                </div>
              </div>

              <!-- Grille des pharmacies -->
              <div class="pharmacy-grid">
                <div 
                  class="pharmacy-card"
                  v-for="(ph, idx) in filteredPharmacies" 
                  :key="idx"
                >
                  <div class="card-head">
                    <div class="card-title">
                      <i class="bi bi-hospital"></i>
                      <span class="name">{{ pharmacyName(ph) }}</span>
                    </div>
                    <span class="badge open">Ouverte</span>
                  </div>
                  <div class="card-body">
                    <div class="rowed">
                      <i class="bi bi-geo"></i>
                      <span>{{ pharmacyDistrict(ph) }}</span>
                    </div>
                    <div class="rowed">
                      <i class="bi bi-telephone"></i>
                      <span>{{ pharmacyPhone(ph) || '—' }}</span>
                    </div>
                    <div class="rowed">
                      <i class="bi bi-shield-check"></i>
                      <span class="insurance">Assurance: <strong>{{ pharmacyAssurance(ph) }}</strong></span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <label class="checkline">
                      <input 
                        type="checkbox" 
                        :checked="selectedPharmacies.has(ph)"
                        @change="togglePharmacySelection(ph)"
                      />
                      Sélectionner
                    </label>
                    <a class="btn-ghost" :href="mapsUrl(ph)" target="_blank" rel="noopener">
                      <i class="bi bi-geo-alt"></i>
                      Localiser
                    </a>
                    <button class="btn-primary" type="button" @click="$emit('select', ph)">
                      <i class="bi bi-cart4"></i>
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions du modal -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">
              <i class="bi bi-x" style="font-size: 20px;"></i>
              Annuler
            </button>
            <button 
              type="button" 
              class="btn-confirm" 
              :disabled="selectedPharmacies.size === 0"
              @click="confirmMultipleSelections"
            >
              <i class="bi bi-check" style="font-size: 20px;"></i>
              Confirmer ({{ selectedPharmacies.size }})
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
  
  <!-- Confirmation de débit (coût en crédits) -->
  <div v-if="showDebitConfirm">
    <div class="modal fade show" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog" style="--bs-modal-width: 520px;">
        <div class="modal-content p-4">
          <h5>Confirmation</h5>
          <p>Cette action vaut 2 crédits. Voulez-vous continuer ?</p>
          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
            <button class="btn-cancel" @click="cancelDebitConfirm">Annuler</button>
            <button class="btn-confirm" :disabled="isDebiting" @click="doConfirmDebitAndEmit">Confirmer</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// Props/Emits
const props = defineProps<{ visible: boolean; province: string | null; pharmacies: any[]; product?: any; loading?: boolean }>()
const emit = defineEmits(['close','select','selectMultiple'])

// Gestion des sélections multiples
import { useCreditStore } from '../stores/credit'

const selectedPharmacies = ref<Set<any>>(new Set())
const showDebitConfirm = ref<boolean>(false)
const isDebiting = ref<boolean>(false)
const creditStore = useCreditStore()

const productName = computed(() => props.product?.libelle || props.product?.nom || props.product?.name || 'Produit')
const productImage = computed(() => props.product?.photoURL || '/assets/placeholder.png')
const loading = computed(() => props.loading === true)

// Recherche et filtrage
const searchQuery = ref<string>('')
const filteredPharmacies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = props.pharmacies || []
  if (!q) return list
  return list.filter((ph: any) => {
    const haystack = [
      pharmacyName(ph),
      pharmacyDistrict(ph),
      pharmacyPhone(ph)
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .join(' | ')
    return haystack.includes(q)
  })
})

function pharmacyName(ph: any) {
  return ph?.nom_pharmacie || ph?.pharmacie?.nom_pharmacie || ph?.name || ph?.pharmacie?.name || 'Pharmacie'
}
function pharmacyDistrict(ph: any) {
  // Quartier = champ "souscription" dans l'objet pharmacie
  return ph?.souscription || ph?.pharmacie?.souscription || '—'
}
function pharmacyPhone(ph: any) {
  return ph?.telephone1 || ph?.pharmacie?.telephone1 || ph?.telephone || ph?.pharmacie?.telephone || ''
}
function pharmacyAssurance(ph: any) {
  const val = ph?.assurance || ph?.pharmacie?.assurance
  if (val === true) return 'Oui'
  if (val === false) return 'Non'
  return val ?? '—'
}
function pharmacyAddress(ph: any) {
  return ph?.adresse || ph?.pharmacie?.adresse || ''
}
function mapsUrl(ph: any) {
  const addr = `${pharmacyName(ph)} ${pharmacyAddress(ph)}`.trim()
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
}

// Gestion des sélections multiples
function togglePharmacySelection(ph: any) {
  if (selectedPharmacies.value.has(ph)) {
    selectedPharmacies.value.delete(ph)
  } else {
    selectedPharmacies.value.add(ph)
  }
}

async function confirmMultipleSelections() {
  if (selectedPharmacies.value.size === 0) return
  // Ouvrir la modale de confirmation indiquant le coût en crédits
  showDebitConfirm.value = true
}

async function doConfirmDebitAndEmit() {
  if (isDebiting.value) return
  isDebiting.value = true
  try {
    // Débiter 2 crédits via le store
    const ok = await creditStore.debitCredits(2)
    if (!ok) {
      // Échec: garder la modale ouverte et alerter l'utilisateur
      alert('Le débit de crédits a échoué. Vérifiez votre solde ou votre connexion.')
      showDebitConfirm.value = false
      return
    }
    // Succès: émettre la sélection multiple
    emit('selectMultiple', Array.from(selectedPharmacies.value))
    selectedPharmacies.value.clear()
    emit('close')
  } catch (e) {
    console.error('Erreur lors du débit des crédits:', e)
    alert('Erreur lors du débit des crédits')
  } finally {
    isDebiting.value = false
    showDebitConfirm.value = false
  }
}

function cancelDebitConfirm() {
  showDebitConfirm.value = false
}
</script>

<style scoped>
.modal-header-modern {
  background: #ffffff;
  border-bottom: 1px solid #edf2f7;
  padding: 1rem 1.5rem;
  position: relative;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.searchbar {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 10px;
}

.searchbar i { color: #64748b; }
.searchbar input {
  border: none;
  outline: none;
  background: transparent;
  min-width: 280px;
  color: #111827;
}

.product-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 10px 14px;
  margin: 16px 0 22px;
}
.strip-left { display: flex; align-items: center; gap: 12px; }
.product-thumb { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
.product-name { font-weight: 600; color: #1f2937; }
.product-helper { color: #6b7280; font-size: 0.85rem; }

.pharmacy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pharmacy-card {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pharmacy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #1f2937; }
.card-title i { color: #0F7ABB; }
.badge.open { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }

.card-body .rowed { display: flex; gap: 8px; align-items: center; color: #4b5563; margin: 6px 0; }
.card-body i { color: #64748b; }
.insurance strong { color: #111827; font-weight: 600; }

.card-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 10px;
}
.checkline { display: flex; align-items: center; gap: 6px; color: #374151; margin-right: auto; }
.checkline input { width: 18px; height: 18px; accent-color: #0F7ABB; }

.btn-ghost {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #111827;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-ghost:hover { background: #f3f4f6; }

.btn-primary {
  background: #0F7ABB;
  border: none;
  color: #ffffff;
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-primary:hover { background: #0a5a8a; }
.modal-content {
  border-radius: 20px;
  border: none;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.product-card {
  background: linear-gradient(145deg, #f8f9ff, #e8ecff);
  border-radius: 20px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.product-image {
  width: 180px;
  height: 140px;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.product-image:hover {
  transform: scale(1.05);
}

.product-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin: 1rem 0;
}

.btn-other-products {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-other-products:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  color: white;
}

.pharmacy-table {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.table thead th {
  background: linear-gradient(135deg, #f8f9ff, #e8ecff);
  border: none;
  color: #4a5568;
  font-weight: 600;
  padding: 1.2rem 1rem;
  font-size: 0.95rem;
}

.table tbody td {
  padding: 1.2rem 1rem;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #f8fafc;
}

.status-available {
  color: green;
  text-decoration: underline;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-block;
}

.btn-localiser {
  background: linear-gradient(135deg, #0F7ABB, #0F7ABB);
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-localiser:hover {
  background: linear-gradient(135deg, #0a5a8a, #0a5a8a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(15, 122, 187, 0.3);
  color: white;
}

.btn-add-cart {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-add-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  color: white;
}

.modal-actions {
  background: #f8f9ff;
  padding: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: transparent;
  border: 2px solid #cbd5e0;
  color: #4a5568;
  border-radius: 25px;
  padding: 12px 30px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #cbd5e0;
  color: #2d3748;
}

.btn-confirm {
  background: linear-gradient(135deg, #48bb78, #38a169);
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
  color: white;
}

.pharmacy-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-info i {
  color: #667eea;
  width: 16px;
}

.insurance-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pharmacy-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
  cursor: pointer;
  transform: scale(1.2);
}

.pharmacy-checkbox:checked {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.btn-confirm:disabled {
  background: #e2e8f0;
  color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-confirm:disabled:hover {
  transform: none;
  box-shadow: none;
}
</style>
