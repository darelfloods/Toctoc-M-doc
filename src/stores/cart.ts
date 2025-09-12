// src/stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  product: any // À typer selon votre modèle Product
  quantite: number
  pharmacy?: any // Détails de la pharmacie sélectionnée (si disponible)
  province?: string // Province sélectionnée pour la réservation
  reservedAt?: string // ISO date de la réservation
  unitPrice?: number
}

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<CartItem[]>([])

  // Getters
  const hasItems = computed(() => items.value.length > 0)

  // Parse un prix venant de l'API ou du localStorage, tolérant aux virgules, espaces, séparateurs milliers et libellés monétaires
  function parsePrice(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9,.-]/g, '')
      let normalized = cleaned
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Supposer la virgule comme séparateur de milliers
        normalized = cleaned.replace(/,/g, '')
      } else if (cleaned.includes(',')) {
        // Traiter la virgule comme séparateur décimal
        normalized = cleaned.replace(/,/g, '.')
      }
      const n = Number(normalized)
      return Number.isFinite(n) ? n : 0
    }
    return 0
  }

  function deriveUnitPrice(src: { product?: any; pharmacy?: any }): number {
    const p = src.product || {}
    const ph = src.pharmacy || src['pharmacie'] || {}
    const candidates = [
      p.prix_de_vente, p.prix, p.price,
      ph.prix_de_vente, ph.prix, ph.price, ph.tarif, ph.tarif_vente,
    ]
    for (const v of candidates) {
      const n = parsePrice(v)
      if (n > 0) return n
    }
    return 0
  }

  const total = computed(() =>
    items.value.reduce((sum, item) => {
      const prix = (typeof item.unitPrice === 'number' && item.unitPrice > 0)
        ? item.unitPrice
        : deriveUnitPrice({ product: item.product, pharmacy: (item as any).pharmacy })
      const qte = Number(item.quantite || 1)
      return sum + prix * qte
    }, 0),
  )

  const itemCount = computed(() => items.value.length)

  // Helper: identité unique de la pharmacie (robuste aux structures variées)
  function pharmacyIdentity(ph: any): string | null {
    if (!ph) return null
    const candidates = [
      ph.id, ph.ID, ph.Id,
      ph.pharmacie?.id, ph.pharmacie?.ID,
      ph.pharmacyId, ph.pharmacie_id,
      ph.code, ph.slug,
      ph.uuid,
      // Combinaisons lisibles si pas d'id clair
      ph.nom && ph.ville ? `${ph.nom}-${ph.ville}` : null,
      ph.name && ph.city ? `${ph.name}-${ph.city}` : null,
    ]
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c).trim() !== '') return String(c)
    }
    return null
  }

  function currentCartPharmacyIdentity(): string | null {
    const first = items.value[0]
    return first ? pharmacyIdentity((first as any).pharmacy || (first as any).pharmacie) : null
  }

  // Actions
  function loadFromStorage() {
    try {
      const json = localStorage.getItem('cart')
      const parsed = json ? JSON.parse(json) : []
      // Normaliser les éléments (quantité et unitPrice persistants)
      items.value = (Array.isArray(parsed) ? parsed : []).map((it: any) => {
        const q = Number(it?.quantite || 1)
        let unitPrice = (typeof it?.unitPrice === 'number') ? it.unitPrice : 0
        if (!(unitPrice > 0)) {
          unitPrice = deriveUnitPrice({ product: it?.product, pharmacy: it?.pharmacy || it?.pharmacie })
        }
        return {
          ...it,
          quantite: q > 0 ? q : 1,
          unitPrice,
        }
      })
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error)
      items.value = []
    }
  }

  function save() {
    try {
      localStorage.setItem('cart', JSON.stringify(items.value))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error)
    }
  }

  // Normalise le libellé d'un produit pour comparaison stricte
  function productLabel(p: any): string {
    const label = p?.libelle ?? p?.nom ?? ''
    return String(label)
  }

  function addReservation(reservation: CartItem): { ok: boolean; error?: string } {
    // Règle: une seule pharmacie par panier
    const cartPhId = currentCartPharmacyIdentity()
    const incomingPhId = pharmacyIdentity((reservation as any).pharmacy || (reservation as any)['pharmacie'])
    if (cartPhId && incomingPhId && cartPhId !== incomingPhId) {
      return { ok: false, error: 'Attention, vous ne pouvez pas faire la réservation dans deux pharmacies différentes' }
    }

    // Vérifier si le produit existe déjà
    const targetId = reservation.product?.id
    const targetCip = reservation.product?.cip
    const targetLabel = productLabel(reservation.product)
    const existingIndex = items.value.findIndex((item) => {
      const sameId = targetId != null && item.product?.id === targetId
      const sameCip = targetCip != null && item.product?.cip === targetCip
      const sameIdentity = sameId || sameCip
      if (!sameIdentity) return false
      // Agrège uniquement si le libellé est identique à 100%
      return productLabel(item.product) === targetLabel
    })

    // Toujours dériver le prix courant depuis la source la plus fraîche
    const newUnitPrice = deriveUnitPrice({ product: reservation.product, pharmacy: (reservation as any).pharmacy })
    const clonedProduct = JSON.parse(JSON.stringify(reservation.product ?? {}))

    if (existingIndex !== -1) {
      // Mettre à jour la quantité
      items.value[existingIndex].quantite += reservation.quantite
      // Toujours rafraîchir le produit et le prix unitaire (comportement "comme la première fois")
      items.value[existingIndex].product = clonedProduct
      if (newUnitPrice > 0) items.value[existingIndex].unitPrice = newUnitPrice
    } else {
      // Ajouter un nouvel item
      items.value.push({
        ...reservation,
        product: clonedProduct,
        unitPrice: newUnitPrice,
        reservedAt: reservation.reservedAt || new Date().toISOString(),
      })
    }

    save()
    return { ok: true }
  }

  function clear() {
    items.value = []
    save()
  }

  function removeAt(index: number) {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1)
      save()
    }
  }

  function removeProduct(productId: number | string) {
    const index = items.value.findIndex(
      (item) => item.product.id === productId || item.product.cip === productId,
    )
    if (index !== -1) {
      removeAt(index)
    }
  }

  function updateQuantity(index: number, newQuantity: number) {
    if (index >= 0 && index < items.value.length) {
      if (newQuantity > 0) {
        items.value[index].quantite = newQuantity
      } else {
        removeAt(index)
      }
      save()
    }
  }

  function updateProductQuantity(productId: number | string, newQuantity: number) {
    const index = items.value.findIndex(
      (item) => item.product.id === productId || item.product.cip === productId,
    )
    if (index !== -1) {
      updateQuantity(index, newQuantity)
    }
  }

  function getProductQuantity(productId: number | string): number {
    const item = items.value.find(
      (item) => item.product.id === productId || item.product.cip === productId,
    )
    return item ? item.quantite : 0
  }

  return {
    // State
    items,

    // Getters
    hasItems,
    total,
    itemCount,

    // Actions
    loadFromStorage,
    save,
    addReservation,
    clear,
    removeAt,
    removeProduct,
    updateQuantity,
    updateProductQuantity,
    getProductQuantity,
  }
})
