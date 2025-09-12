<template>
  <div v-if="visible">
    <div class="modal fade show" id="confirmation" tabindex="-1" aria-hidden="true" style="display:block;" role="dialog" aria-modal="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog" style="--bs-modal-width: 700px;">
        <div class="modal-content pb-4">
          <div class="modal-body pt-0">
            <div class="modal-header-custom">
              <button type="button" class="close-btn" aria-label="Close" @click="$emit('close')"></button>
              <div class="header-center text-center w-100">
                <img src="/assets/Fichier 12.svg" width="100" height="100" alt="" class="logo-header mb-2">
                <h4 class="confirmation-title mb-0">Ajout au Panier</h4>
              </div>
            </div>

            <div class="row g-3 align-items-stretch">
              <!-- Left: product image -->
              <div class="col-5 text-center position-relative">
                <img class="product-image" :src="productImage" alt="Produit">
                <div class="badge-new">Nouveau</div>
              </div>
              <!-- Right: pharmacy + product info -->
              <div class="col-7 pharmacy-info">
                <div class="mb-2">
                  <span class="badge bg-primary">{{ province || '—' }}</span>
                </div>
                <h6 class="pharmacy-name">
                  <i class="fas fa-clinic-medical"></i>
                  {{ pharmacyName(pharmacy) }}
                </h6>
                <p class="pharmacy-details">
                  <i class="fas fa-map-marker-alt text-primary"></i>
                  {{ pharmacyAddress(pharmacy) }}<span v-if="pharmacyPhone(pharmacy)">, Tel: {{ pharmacyPhone(pharmacy) }}</span>
                </p>
                <div class="product-name">
                  <i class="fas fa-pills me-2"></i>
                  {{ productName }}
                </div>
                <div class="stock-status">
                  <i class="fas fa-check-circle"></i>
                  {{ pharmacy?.statut === 'disponible' ? 'Actuellement en stock' : 'Stock limité' }}
                </div>

                <div class="divider"></div>

                <div class="quantity-price-section">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="fas fa-calculator"></i>
                          Quantité
                        </div>
                        <input v-model.number="quantite" type="number" class="form-control form-control-custom" min="1" />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="fas fa-tag"></i>
                          Prix unitaire
                        </div>
                        <div class="price-display">
                          <i class="fas fa-coins"></i>
                          {{ unitPrice }} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row mt-3">
                    <div class="col-12">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="fas fa-receipt"></i>
                          Total
                        </div>
                        <div class="price-display" style="font-size: 1.3rem; color: #0F7ABB;">
                          <i class="fas fa-money-bill-wave"></i>
                          {{ totalPrice }} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-continue" @click="$emit('close')">
                    <i class="fas fa-search"></i>
                    Continuer les recherches
                  </button>
                  <button class="btn-confirm" @click="confirm">
                    <i class="fas fa-check"></i>
                    Confirmer l'ajout
                  </button>
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
import { ref, computed, watch } from 'vue'

const props = defineProps<{ visible: boolean; province: string | null; pharmacy: any; product?: any }>()
const emit = defineEmits(['close','confirm'])

const quantite = ref<number>(1)

watch(() => props.visible, (v) => {
  if (v) { quantite.value = 1 }
})

function confirm() {
  emit('confirm', { quantite: quantite.value })
}

const unitPrice = computed(() => Number(props.product?.prix_de_vente || 0))
const totalPrice = computed(() => unitPrice.value * Math.max(1, Number(quantite.value || 1)))
const productName = computed(() => props.product?.libelle || props.product?.nom || props.product?.name || 'Produit')
const productImage = computed(() => props.product?.photoURL || '/assets/placeholder.png')
const pharmacy = computed(() => props.pharmacy)

function pharmacyName(ph: any) {
  return ph?.nom_pharmacie || ph?.pharmacie?.nom_pharmacie || ph?.name || ph?.pharmacie?.name || 'Pharmacie'
}
function pharmacyAddress(ph: any) {
  return ph?.adresse || ph?.pharmacie?.adresse || ph?.souscription || ph?.pharmacie?.souscription || ''
}
function pharmacyPhone(ph: any) {
  return ph?.telephone1 || ph?.pharmacie?.telephone1 || ''
}
</script>

<style scoped>
.modal-content { border-radius: 20px; border: none; box-shadow: 0 30px 60px rgba(0,0,0,.15); overflow: hidden; }
.modal-header-custom { display:flex; flex-direction: column; align-items:center; justify-content:center; gap:8px; padding: 1.25rem 1rem 0.75rem; position: relative; text-align: center; }
.close-btn { position:absolute; right:14px; top:14px; width:40px; height:40px; border-radius:50%; border:none; background: rgba(0,0,0,0.05); }
.confirmation-title { font-weight: 700; }
.confirmation-icon { color:#0F7ABB; }
.logo-header { display:block; margin: 0 auto; }
.product-image { width: 100%; max-width: 260px; height: auto; object-fit: contain; border-radius: 12px; }
.badge-new { position:absolute; top:8px; left:50%; transform: translateX(-50%); background:#0F7ABB; color:#fff; border-radius: 8px; padding: 4px 8px; font-size: .75rem; }
.pharmacy-name { font-weight: 700; display:flex; align-items:center; gap:8px; }
.pharmacy-details { color:#4b5563; font-size:.9rem; }
.product-name { font-weight:600; margin-top:6px; }
.stock-status { color:#16a34a; font-weight:600; margin-top:4px; }
.divider { height:1px; background: #e5e7eb; margin: 10px 0; }
.input-group-custom { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; }
.input-label { font-size:.9rem; color:#6b7280; display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.form-control-custom { border:none; background:transparent; box-shadow:none; }
.price-display { font-weight:700; color:#1f2937; display:flex; align-items:center; gap:8px; }
.action-buttons { display:flex; gap:10px; margin-top:14px; }
.btn-continue { background:#f3f4f6; border:none; color:#111827; border-radius:10px; padding:10px 14px; font-weight:600; }
.btn-confirm { background: linear-gradient(135deg,#10b981,#059669); border:none; color:#fff; border-radius:10px; padding:10px 14px; font-weight:700; }
.list-group-item.active { background-color: #e6f9ef; border-color: #3AB24F; color: #1f2937; }
</style>
