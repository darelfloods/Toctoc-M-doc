<template>
  <div v-if="visible">
    <div class="modal fade show" id="confirmation" tabindex="-1" aria-hidden="true" style="display:block;" role="dialog" aria-modal="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog" style="--bs-modal-width: 700px;">
        <div class="modal-content pb-4">
          <div class="modal-body pt-0">
            <div class="modal-header-custom">
              <button type="button" class="close-btn mt-3" aria-label="Close" @click="$emit('close')">
                <i class="bi bi-x" style="font-size: 20px;"></i>
              </button>
              <div class="header-center text-center w-100">
                <img src="/assets/Fichier 12.svg" width="100" height="100" alt="" class="logo-header mb-2">
                <h4 class="confirmation-title mb-0">Ajout au Panier</h4>
              </div>
            </div>

            <div class="row g-3 align-items-stretch">
              <!-- Left: product image -->
              <div class="col-5 text-center position-relative">
                <img 
                  class="product-image" 
                  :src="productImage" 
                  alt="Produit"
                  @error="(e) => { 
                    const target = e.target as HTMLImageElement
                    if (target.src !== '/assets/placeholder.png') {
                      target.src = '/assets/placeholder.png'
                    }
                  }"
                >
                <div class="badge-new">Nouveau</div>
              </div>
              <!-- Right: pharmacy + product info -->
              <div class="col-7 pharmacy-info">
                <div class="mb-2">
                  <span class="badge bg-primary">{{ province || '—' }}</span>
                </div>
                <h6 class="pharmacy-name">
                  <i class="bi bi-shop" style="font-size: 20px;"></i>
                  {{ pharmacyName(pharmacy) }}
                </h6>
                <p class="pharmacy-details">
                  <i class="bi bi-info" style="font-size: 20px;"></i>
                  {{ pharmacyAddress(pharmacy) }}<span v-if="pharmacyPhone(pharmacy)">, Tel: {{ pharmacyPhone(pharmacy) }}</span>
                </p>
                <div class="product-name">
                  <i class="bi bi-capsule" style="font-size: 20px;"></i>
                  {{ productName }}
                </div>
                <div class="stock-status">
                  <i class="bi bi-bar-chart" style="font-size: 20px;"></i>
                  {{ pharmacy?.statut === 'disponible' ? 'Actuellement en stock' : 'Stock limité' }}
                </div>

                <div class="divider"></div>

                <div class="quantity-price-section">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="bi bi-123" style="font-size: 20px;"></i>
                          Quantité
                        </div>
                        <input v-model.number="quantite" type="number" class="form-control form-control-custom" min="1" />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="bi bi-cash" style="font-size: 20px;"></i>
                          Prix unitaire
                        </div>
                        <div class="price-display">
                          <i class="bi bi-currency-exchange" style="font-size: 20px;"></i>
                          {{ unitPrice }} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row mt-3">
                    <div class="col-12">
                      <div class="input-group-custom">
                        <div class="input-label">
                          <i class="bi bi-receipt" style="font-size: 20px;"></i>
                          Total
                        </div>
                        <div class="price-display" style="font-size: 1.3rem; color: #0F7ABB;">
                          <i class="bi bi-currency-exchange" style="font-size: 20px;"></i>
                          {{ totalPrice }} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-continue" @click="$emit('close')">
                    <i class="bi bi-search" style="font-size: 20px;"></i>
                    Continuer les recherches
                  </button>
                  <button class="btn-confirm" @click="confirm">
                    <i class="bi bi-check" style="font-size: 20px;"></i>
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
import { getProductImage } from '../utils/imageUtils'
import { useCreditStore } from '../stores/credit'

const props = defineProps<{ visible: boolean; province: string | null; pharmacy: any; product?: any }>()
const emit = defineEmits(['close','confirm'])

const quantite = ref<number>(1)
const creditStore = useCreditStore()

// Petit helper visuel local pour indiquer le débit
function showLocalDebitToast(text = '2 crédits ont été débités') {
  const id = 'reservation-credit-debited'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id = id
    Object.assign(el.style, {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: '2000',
      background: '#0F7ABB',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(15,122,187,0.25)',
      fontWeight: '600',
      fontSize: '14px',
      display: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(el)
  }
  el.textContent = text
  el.style.display = 'block'
  window.setTimeout(() => { el && (el.style.display = 'none') }, 3000)
}

watch(() => props.visible, async (v) => {
  if (v) {
    quantite.value = 1
    try {
      // Débiter 2 crédits à l'ouverture de la modale
      const success = await creditStore.debitCredits(2)
      if (success) {
        showLocalDebitToast('2 crédits ont été débités')
      } else {
        console.warn('Le débit des crédits a échoué (ou compte manquant)')
      }
    } catch (e) {
      console.error('Erreur lors du débit des crédits à l ouverture du modal:', e)
    }
  }
})

function confirm() {
  emit('confirm', { quantite: quantite.value })
}

const unitPrice = computed(() => Number(props.product?.prix_de_vente || 0))
const totalPrice = computed(() => unitPrice.value * Math.max(1, Number(quantite.value || 1)))
const productName = computed(() => props.product?.libelle || props.product?.nom || props.product?.name || 'Produit')
const productImage = computed(() => getProductImage(props.product))
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
.modal-header-custom { 
  display:flex; 
  flex-direction: column; 
  align-items:center; 
  justify-content:center; 
  gap:8px; 
  padding: 1.25rem 0 0.75rem 0; 
  margin: -20px -20px 20px -20px;
  position: relative; 
  text-align: center; 
  background: #0F7ABB;
  border-radius: 20px 20px 0 0;
}
.close-btn { 
  position:absolute; 
  right:14px; 
  top:14px; 
  width:40px; 
  height:40px; 
  border-radius:50%; 
  border:none; 
  background: rgba(255,255,255,0.2); 
  color: white; 
  z-index: 10;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirmation-title { font-weight: 700; color: white; }
.confirmation-icon { color:#0F7ABB; }
.logo-header { display:block; margin: 0 auto; }
.product-image { width: 100%; max-width: 260px; height: auto; object-fit: contain; border-radius: 12px; }
.badge-new { position:absolute; top:8px; left:50%; transform: translateX(-50%); background: linear-gradient(135deg, #10b981, #059669); color:#fff; border-radius: 8px; padding: 4px 8px; font-size: .75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
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
