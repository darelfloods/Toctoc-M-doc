<template>
  <div v-if="visible">
    <div class="modal fade show" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog" style="--bs-modal-width: 1100px; --bs-modal-height: 1000px;">
        <div class="modal-content">
          <!-- Header avec gradient violet -->
          <div class="modal-header-custom">
            <button type="button" class="close-btn" aria-label="Close" @click="$emit('close')">
              <i class="bi bi-x" style="font-size: 24px;"></i>
            </button>
            <div class="text-center">
              <img class="pharmacy-icon" :src="productImage" alt="Pharmacie">
              <h4 class="modal-title">Liste des pharmacies de {{ province || 'la province sélectionnée' }}</h4>
              <p class="modal-subtitle">Où vous pouvez trouver le produit</p>
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
              <!-- Carte du produit - au-dessus du tableau -->
              <div class="row mb-5">
                <div class="col-md-12">
                  <div class="product-card mb-0">
                    <div class="row align-items-center">
                      <div class="col-md-3 text-center">
                        <img class="product-image" :src="productImage" alt="Produit">
                      </div>
                      <div class="col-md-6">
                        <h6 class="product-title">{{ productName }}</h6>
                        <button class="btn-other-products mt-1" type="button">
                          <i class="bi bi-three-dots-vertical" style="font-size: 20px;"></i>
                          Autres produits
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tableau des pharmacies - pleine largeur -->
              <div class="row">
                <div class="col-md-12">
                  <div class="pharmacy-table">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Quartier</th>
                          <th>Contact</th>
                          <th>Assurance</th>
                          <th>Itinéraire</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(ph, idx) in pharmacies" :key="idx">
                          <td style="text-decoration: underline; font-weight: 600;">
                            {{ pharmacyName(ph) }}
                            <span class="status-available">Ouverte</span>
                          </td>
                          <td>{{ pharmacyDistrict(ph) }}</td>
                          <td>
                            <div class="contact-info">
                              <i class="bi bi-telephone ms-1" style="font-size: 20px;"></i>
                              {{ pharmacyPhone(ph) || '—' }}
                            </div>
                          </td>
                          <td>
                            <span class="insurance-badge">{{ pharmacyAssurance(ph) }}</span>
                          </td>
                          <td>
                            <a class="btn-localiser" :href="mapsUrl(ph)" target="_blank" rel="noopener">
                              <i class="bi bi-geo-alt" style="font-size: 20px;"></i>
                              Localiser
                            </a>
                          </td>
                          <td>
                            <div class="action-buttons">
                              <!-- Checkbox pour sélection multiple -->
                              <input 
                                type="checkbox" 
                                :checked="selectedPharmacies.has(ph)"
                                @change="togglePharmacySelection(ph)"
                                class="pharmacy-checkbox"
                              >
                              <!-- Bouton ajout individuel -->
                              <button class="btn-add-cart" type="button" @click="$emit('select', ph)">
                                <i class="bi bi-cart4" style="font-size: 20px;"></i>
                                Ajouter
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// Props/Emits
const props = defineProps<{ visible: boolean; province: string | null; pharmacies: any[]; product?: any; loading?: boolean }>()
const emit = defineEmits(['close','select','selectMultiple'])

// Gestion des sélections multiples
const selectedPharmacies = ref<Set<any>>(new Set())

const productName = computed(() => props.product?.libelle || props.product?.nom || props.product?.name || 'Produit')
const productImage = computed(() => props.product?.photoURL || '/assets/placeholder.png')
const loading = computed(() => props.loading === true)

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

function confirmMultipleSelections() {
  if (selectedPharmacies.value.size > 0) {
    emit('selectMultiple', Array.from(selectedPharmacies.value))
    selectedPharmacies.value.clear()
    emit('close')
  }
}
</script>

<style scoped>
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
