<template>
  <div v-if="visible">
    <div class="modal fade show" id="panier" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-cart-responsive">
        <div class="modal-content">
          <!-- Header avec gradient -->
          <div class="modal-header-cart">
            <button type="button" class="close-btn-cart" aria-label="Fermer" @click="$emit('close')">
              <i class="bi bi-x" style="font-size: 20px;"></i>
            </button>
            <div class="cart-icon position-relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0" />
              </svg>
              <div class="badge-count">{{ items.length }}</div>
            </div>
            <h4 class="cart-title">Mon Panier</h4>
            <p class="cart-subtitle">Vos produits sélectionnés</p>
          </div>

          <div class="cart-content">
            <div class="row">
              <!-- Section des produits -->
              <div class="col-lg-8">
                <div class="products-section">
                  <h6 class="section-title">Produits sélectionnés</h6>

                  <div v-for="(item, i) in items" :key="i" class="product-card">
                    <!-- Layout responsive: colonne sur mobile, ligne sur desktop -->
                    <div class="product-card-content">
                      <!-- Section image + info -->
                      <div class="product-main-section">
                        <img :src="item.product?.photoURL || '/assets/placeholder.png'" alt="Produit" class="product-image-cart">
                        <div class="product-info">
                          <div class="product-name-cart">{{ item.product?.libelle || item.product?.nom || 'Produit' }}</div>
                          <div class="product-pharmacy">
                            <i class="bi bi-shop"></i>
                            {{ pharmacyName(item.pharmacy) }}<template v-if="pharmacyCity(item.pharmacy)">, {{ pharmacyCity(item.pharmacy) }}</template>
                          </div>
                          <div class="mt-2">
                            <span class="status-badge">En stock</span>
                          </div>
                        </div>
                      </div>

                      <!-- Section contrôles (prix + quantité + suppression) -->
                      <div class="product-controls-section">
                        <div class="price-section">
                          <div class="unit-price">{{ unitPrice(item).toFixed(2) }} FCFA</div>
                          <div class="total-price">{{ (unitPrice(item) * (item.quantite || 1)).toFixed(2) }} FCFA</div>
                        </div>
                        <div class="quantity-controls">
                          <button class="qty-btn" @click="decrement(i)">-</button>
                          <span class="qty-display">{{ item.quantite }}</span>
                          <button class="qty-btn" @click="increment(i)">+</button>
                        </div>
                        <button class="remove-btn" @click="remove(i)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="items.length === 0" class="text-center text-muted">
                    Aucun produit dans le panier.
                  </div>
                </div>
              </div>

              <!-- Section résumé -->
              <div class="col-lg-4">
                <div class="summary-card">
                  <h6 class="summary-title">Résumé de la commande</h6>

                  <div class="summary-item">
                    <span class="summary-label">Nombre d'articles</span>
                    <span class="summary-value">{{ items.length }}</span>
                  </div>

                  <div class="summary-item">
                    <span class="summary-label">Sous-total</span>
                    <span class="summary-value">{{ total.toFixed(2) }} FCFA</span>
                  </div>

                  <div class="summary-item">
                    <span class="summary-label">Livraison</span>
                    <span class="summary-value">Bientôt</span>
                  </div>

                  <div class="summary-item">
                    <span class="summary-label"><strong>Total TTC</strong></span>
                    <span class="total-value">{{ total.toFixed(2) }} FCFA</span>
                  </div>

                  <div class="action-buttons justify-content-center">
                    <button v-if="items.length > 0" class="btn-clear" @click="clearCart">
                      <i class="bi bi-trash" style="font-size: 20px;"></i>
                      Vider
                    </button>
                    <!-- 🚫 Bouton Commander temporairement masqué -->
                    <!--
                    <button class="btn-checkout" :disabled="loading || items.length === 0" @click="commander">
                      <span v-if="!loading">Commander</span>
                      <span v-else>Traitement...</span>
                    </button>
                    -->
                  </div>
                  <div v-if="statusMessage" class="reservation-status mt-3" :class="statusType === 'success' ? 'text-success' : 'text-danger'">
                    {{ statusMessage }}
                  </div>
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
import { ref, computed } from 'vue'
import { useCartStore } from '../stores/cart'
// import { HttpService } from '../Services/HttpService' // Non utilisé pour éviter la préfixation BASE_URL

const props = defineProps<{ visible: boolean }>()
const cart = useCartStore()
cart.loadFromStorage()

const items = computed(() => cart.items)
const total = computed(() => cart.total)
const loading = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error'>('success')

function pharmacyName(ph: any) {
  return (
    ph?.nom_pharmacie ||
    ph?.pharmacie?.nom_pharmacie ||
    ph?.name ||
    ph?.pharmacie?.name ||
    'Pharmacie'
  )
}
function pharmacyCity(ph: any) {
  return (
    ph?.ville || ph?.city || ph?.localite || ph?.commune ||
    ph?.pharmacie?.ville || ph?.pharmacie?.city || ph?.pharmacie?.localite || ph?.pharmacie?.commune ||
    ''
  )
}

function parsePrice(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '')
    let normalized = cleaned
    if (cleaned.includes(',') && cleaned.includes('.')) {
      normalized = cleaned.replace(/,/g, '')
    } else if (cleaned.includes(',')) {
      normalized = cleaned.replace(/,/g, '.')
    }
    const n = Number(normalized)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function unitPrice(it: any) {
  const raw = it.product?.prix_de_vente ?? it.product?.prix ?? 0
  return parsePrice(raw)
}
function increment(index: number) {
  const q = (items.value[index]?.quantite || 1) + 1
  cart.updateQuantity(index, q)
}
function decrement(index: number) {
  const current = items.value[index]?.quantite || 1
  if (current > 1) cart.updateQuantity(index, current - 1)
}
function remove(index: number) { cart.removeAt(index) }
function clearCart() { cart.clear() }

// Identifiant de réservation persistant (>= 1000000)
function nextReservationId(): number {
  try {
    const key = 'next_reservation_id'
    const raw = localStorage.getItem(key)
    let next = Number(raw)
    if (!Number.isFinite(next) || next < 1000000) {
      next = 1000000
    }
    // Réserver l'id courant et incrémenter pour la prochaine fois
    localStorage.setItem(key, String(next + 1))
    return next
  } catch {
    return 1000000
  }
}

function resolveProductId(p: any): number | string | null {
  const candidates = [p?.id, p?.ID, p?.cip, p?.code]
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '') return c
  }
  return null
}

function resolveProductLabel(p: any): string {
  return p?.libelle ?? p?.nom ?? p?.name ?? 'Produit'
}

async function postReservationProduct(payload: any): Promise<Response> {
  const base = import.meta.env.DEV
    ? '/reservations-api'
    : 'https://demo2.srv557357.hstgr.cloud'
  const url = `${base}/api/reservation_produits`
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

async function commander() {
  if (!items.value.length || loading.value) return
  loading.value = true
  statusMessage.value = ''
  try {
    const reservationId = nextReservationId()
    const responses = await Promise.all(items.value.map(async (it) => {
      const p = it.product || {}
      const payload = {
        reservation_id: reservationId,
        produit_id: resolveProductId(p),
        libelle: resolveProductLabel(p),
        qte: Number(it.quantite || 1),
        prix_de_vente: unitPrice(it),
      }
      // Validation minimale côté client
      if (!payload.produit_id) throw new Error('Produit sans identifiant')
      const res = await postReservationProduct(payload)
      if (!res.ok || (res.status !== 200 && res.status !== 201)) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erreur API (${res.status})`)
      }
      return res
    }))

    if (responses.every(r => r.ok && (r.status === 200 || r.status === 201))) {
      statusType.value = 'success'
      statusMessage.value = 'Produit réservé avec succès ✅'
    } else {
      statusType.value = 'error'
      statusMessage.value = 'Échec de la réservation ❌'
    }
  } catch (e: any) {
    console.error('Erreur lors de la réservation:', e)
    statusType.value = 'error'
    statusMessage.value = 'Échec de la réservation ❌'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========================================
   BASE STYLES - Modal & Header
   ======================================== */
.modal-content {
  border-radius: 25px;
  border: none;
  box-shadow: 0 30px 60px rgba(0,0,0,.15);
  overflow: hidden;
  background: linear-gradient(145deg,#ffffff,#f8fafc);
}

.modal-header-cart {
  background: linear-gradient(135deg,#667eea,#764ba2);
  color:#fff;
  padding:2rem;
  text-align:center;
  position:relative;
}

.close-btn-cart {
  position:absolute;
  top:20px;
  right:25px;
  background:rgba(255,255,255,0.2);
  border:none;
  color:white;
  width:40px;
  height:40px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:all .3s ease;
  backdrop-filter: blur(10px);
}
.close-btn-cart:hover {
  background:rgba(255,255,255,0.3);
  transform: rotate(90deg) scale(1.1);
}

.cart-icon {
  width:80px;
  height:80px;
  background:rgba(255,255,255,0.2);
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  margin:0 auto 1rem;
  backdrop-filter: blur(10px);
}

.badge-count {
  position:absolute;
  top:-5px;
  right:-5px;
  background: linear-gradient(135deg,#f56565,#e53e3e);
  color:#fff;
  font-size:.7rem;
  padding:3px 6px;
  border-radius:10px;
  font-weight:600;
  min-width:18px;
  height:18px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.cart-title {
  font-size:1.5rem;
  font-weight:600;
  margin-bottom:.5rem;
}

.cart-subtitle {
  opacity:.9;
  font-size:1rem;
}

.cart-content {
  padding:2rem;
}

/* ========================================
   PRODUCTS SECTION
   ======================================== */
.products-section {
  background:#fff;
  border-radius:20px;
  padding:1.5rem;
  box-shadow:0 8px 32px rgba(0,0,0,.08);
  margin-bottom:2rem;
  border:1px solid rgba(102,126,234,0.1);
  max-height: 70vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.section-title {
  color:#2d3748;
  font-size:1.2rem;
  font-weight:600;
  margin-bottom:1.5rem;
  display:flex;
  align-items:center;
  gap:10px;
}
.section-title::after {
  content:'';
  flex:1;
  height:2px;
  background:linear-gradient(90deg,#667eea,transparent);
  border-radius:1px;
}

/* Custom scrollbar */
.products-section::-webkit-scrollbar { width: 8px; }
.products-section::-webkit-scrollbar-track { background: #eef2ff; border-radius: 10px; }
.products-section::-webkit-scrollbar-thumb { background: #c3d0ff; border-radius: 10px; }
.products-section::-webkit-scrollbar-thumb:hover { background: #9fb2ff; }

/* ========================================
   PRODUCT CARD - Desktop Layout (default)
   ======================================== */
.product-card {
  background:#f8fafc;
  border-radius:15px;
  padding:1.5rem;
  margin-bottom:1rem;
  border:1px solid #e2e8f0;
  transition:all .3s ease;
  position:relative;
  overflow:hidden;
}
.product-card::before {
  content:'';
  position:absolute;
  top:0;
  left:0;
  width:4px;
  height:100%;
  background: linear-gradient(135deg,#667eea,#764ba2);
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow:0 8px 25px rgba(102,126,234,0.15);
  border-color:#667eea;
}

.product-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-main-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.product-controls-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.product-image-cart {
  width:70px;
  height:70px;
  object-fit:cover;
  border-radius:12px;
  box-shadow:0 4px 15px rgba(0,0,0,0.1);
  border:2px solid #e2e8f0;
  flex-shrink: 0;
}

.product-info {
  flex:1;
  min-width: 0;
}

.product-name-cart {
  font-weight:600;
  color:#2d3748;
  font-size:1rem;
  margin-bottom:.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-pharmacy {
  color:#64748b;
  font-size:.85rem;
  display:flex;
  align-items:center;
  gap:5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  background: linear-gradient(135deg,#48bb78,#38a169);
  color:#fff;
  padding:4px 10px;
  border-radius:15px;
  font-size:.75rem;
  font-weight:500;
  display: inline-block;
}

.price-section {
  text-align:center;
  min-width:100px;
}

.unit-price {
  color:#667eea;
  font-weight:600;
  font-size:.85rem;
}

.total-price {
  color:#2d3748;
  font-weight:700;
  font-size:1rem;
}

.quantity-controls {
  display:flex;
  align-items:center;
  gap:.5rem;
  background:#fff;
  border-radius:25px;
  padding:5px;
  border:2px solid #e2e8f0;
  min-width:110px;
  justify-content:center;
}

.qty-btn {
  width:30px;
  height:30px;
  border:none;
  border-radius:50%;
  background: linear-gradient(135deg,#667eea,#764ba2);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:all .2s ease;
  font-size:.9rem;
  font-weight: 600;
}
.qty-btn:hover {
  transform: scale(1.1);
  box-shadow:0 4px 15px rgba(102,126,234,0.3);
}

.qty-display {
  min-width:35px;
  text-align:center;
  font-weight:600;
  color:#2d3748;
}

.remove-btn {
  background: linear-gradient(135deg,#f56565,#e53e3e);
  border:none;
  color:#fff;
  width:35px;
  height:35px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  transition: all .3s ease;
  flex-shrink: 0;
}
.remove-btn:hover {
  transform: scale(1.1);
  box-shadow:0 4px 15px rgba(245,101,101,0.3);
}

/* ========================================
   SUMMARY SECTION
   ======================================== */
.summary-card {
  background: linear-gradient(145deg,#f8fafc,#e8ecff);
  border-radius:20px;
  padding:2rem;
  box-shadow:0 8px 32px rgba(102,126,234,0.1);
  border:1px solid rgba(102,126,234,0.1);
  position: sticky;
  top:2rem;
}

.summary-title {
  color:#2d3748;
  font-size:1.3rem;
  font-weight:600;
  margin-bottom:1.5rem;
  text-align:center;
  position:relative;
}
.summary-title::after {
  content:'';
  position:absolute;
  bottom:-8px;
  left:50%;
  transform: translateX(-50%);
  width:50px;
  height:3px;
  background: linear-gradient(135deg,#667eea,#764ba2);
  border-radius:2px;
}

.summary-item {
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:.75rem 0;
  border-bottom:1px solid rgba(102,126,234,0.1);
}
.summary-item:last-child {
  border-bottom:none;
  padding-top:1rem;
  margin-top:.5rem;
  border-top:2px solid rgba(102,126,234,0.2);
}

.summary-label {
  color:#64748b;
  font-weight:500;
}

.summary-value {
  color:#2d3748;
  font-weight:600;
}

.total-value {
  color:#667eea;
  font-weight:700;
  font-size:1.2rem;
}

.action-buttons {
  display:flex;
  gap:1rem;
  margin-top:2rem;
}

.btn-clear {
  background:transparent;
  border:2px solid #f56565;
  color:#f56565;
  border-radius:25px;
  padding:12px 25px;
  font-weight:500;
  transition:all .3s ease;
  display:flex;
  align-items:center;
  gap:8px;
}
.btn-clear:hover {
  background:#f56565;
  color:#fff;
  transform: translateY(-2px);
  box-shadow:0 6px 20px rgba(245,101,101,0.3);
}

.btn-checkout {
  background: linear-gradient(135deg,#48bb78,#38a169);
  border:none;
  border-radius:25px;
  padding:12px 25px;
  color:#fff;
  font-weight:500;
  transition:all .3s ease;
  box-shadow:0 4px 15px rgba(72,187,120,0.3);
  display:flex;
  align-items:center;
  gap:8px;
  flex:1;
  justify-content:center;
}
.btn-checkout:hover {
  transform: translateY(-2px);
  box-shadow:0 6px 20px rgba(72,187,120,0.4);
  color:#fff;
}

.reservation-status {
  font-weight: 600;
}
.text-success {
  color: #198754;
}
.text-danger {
  color: #dc3545;
}

/* ========================================
   RESPONSIVE DESIGN - Modal Sizes
   ======================================== */
.modal-cart-responsive {
  max-width: 1140px;
  margin: 1.75rem auto;
}

.modal-dialog.modal-dialog-scrollable .modal-content {
  max-height: 90vh;
}

/* ========================================
   TABLET (768px - 991px)
   ======================================== */
@media (max-width: 991px) {
  .modal-cart-responsive {
    max-width: 95%;
    margin: 1rem auto;
  }

  .cart-content {
    padding: 1.5rem;
  }

  .products-section {
    max-height: 50vh;
    padding: 1rem;
  }

  .summary-card {
    position: static;
    top: auto;
    margin-top: 1rem;
  }

  /* Réduire les espacements sur tablette */
  .product-card {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }
}

/* ========================================
   MOBILE (< 768px) - Complete Redesign
   ======================================== */
@media (max-width: 767px) {
  .modal-cart-responsive {
    max-width: 100%;
    margin: 0;
    height: 100vh;
  }

  .modal-content {
    border-radius: 0;
    height: 100vh;
  }

  .modal-header-cart {
    padding: 1.5rem 1rem;
  }

  .cart-icon {
    width: 60px;
    height: 60px;
  }

  .cart-title {
    font-size: 1.25rem;
  }

  .cart-subtitle {
    font-size: 0.9rem;
  }

  .close-btn-cart {
    top: 15px;
    right: 15px;
    width: 35px;
    height: 35px;
  }

  .cart-content {
    padding: 1rem;
  }

  .products-section {
    padding: 1rem;
    max-height: 55vh;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  /* LAYOUT MOBILE - Stack vertically */
  .product-card {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .product-card-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .product-main-section {
    width: 100%;
    gap: 0.75rem;
  }

  .product-image-cart {
    width: 60px;
    height: 60px;
  }

  .product-name-cart {
    font-size: 0.95rem;
    -webkit-line-clamp: 2;
  }

  .product-pharmacy {
    font-size: 0.8rem;
  }

  .product-pharmacy i {
    font-size: 14px;
  }

  .status-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
  }

  /* CONTROLS SECTION - Horizontal on mobile */
  .product-controls-section {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .price-section {
    text-align: left;
    min-width: auto;
    flex: 1;
  }

  .unit-price {
    font-size: 0.75rem;
  }

  .total-price {
    font-size: 0.95rem;
  }

  .quantity-controls {
    min-width: 100px;
    padding: 3px;
  }

  .qty-btn {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .qty-display {
    min-width: 30px;
    font-size: 0.9rem;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
  }

  .remove-btn i {
    font-size: 16px;
  }

  /* SUMMARY SECTION - Mobile */
  .summary-card {
    padding: 1.25rem;
  }

  .summary-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .summary-item {
    padding: 0.5rem 0;
    font-size: 0.9rem;
  }

  .summary-label,
  .summary-value {
    font-size: 0.9rem;
  }

  .total-value {
    font-size: 1.1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn-clear,
  .btn-checkout {
    width: 100%;
    justify-content: center;
    padding: 10px 20px;
    font-size: 0.95rem;
  }
}

/* ========================================
   EXTRA SMALL MOBILE (< 380px)
   ======================================== */
@media (max-width: 379px) {
  .cart-content {
    padding: 0.75rem;
  }

  .products-section,
  .summary-card {
    padding: 0.75rem;
  }

  .product-card {
    padding: 0.75rem;
  }

  .product-image-cart {
    width: 50px;
    height: 50px;
  }

  .product-name-cart {
    font-size: 0.875rem;
  }

  .product-pharmacy {
    font-size: 0.75rem;
  }

  .quantity-controls {
    min-width: 90px;
  }

  .qty-btn {
    width: 26px;
    height: 26px;
  }

  .remove-btn {
    width: 30px;
    height: 30px;
  }
}
</style>
