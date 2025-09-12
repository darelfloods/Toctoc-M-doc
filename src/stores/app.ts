import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const selectedProduct = ref<any>(null)
  const disponibilityPharmacies = ref<any[]>([])
  const isLoadingDisponibilite = ref(false)
  const isGlobalLoading = ref(false)

  // Getters
  const hasSelectedProduct = computed(() => !!selectedProduct.value)
  const hasDisponibilityData = computed(() => disponibilityPharmacies.value.length > 0)

  // Actions
  function setSelectedProduct(product: any) {
    selectedProduct.value = product
    // Persister pour la persistance entre sessions si nécessaire
    if (product) {
      localStorage.setItem('product_selected', JSON.stringify(product))
    } else {
      localStorage.removeItem('product_selected')
    }
  }

  function setDisponibilityPharmacies(pharmacies: any[]) {
    disponibilityPharmacies.value = pharmacies
    // Persister pour la persistance entre sessions si nécessaire
    localStorage.setItem('disponibility_pharmacies', JSON.stringify(pharmacies))
  }

  function setLoadingDisponibilite(loading: boolean) {
    isLoadingDisponibilite.value = loading
    localStorage.setItem('is_loading', loading.toString())
  }

  function setGlobalLoading(loading: boolean) {
    isGlobalLoading.value = loading
  }

  function clearDisponibilityData() {
    disponibilityPharmacies.value = []
    localStorage.removeItem('disponibility_pharmacies')
  }

  function clearSelectedProduct() {
    selectedProduct.value = null
    localStorage.removeItem('product_selected')
  }

  function initializeFromStorage() {
    try {
      // Récupérer le produit sélectionné
      const storedProduct = localStorage.getItem('product_selected')
      if (storedProduct) {
        selectedProduct.value = JSON.parse(storedProduct)
      }

      // Récupérer les pharmacies de disponibilité
      const storedPharmacies = localStorage.getItem('disponibility_pharmacies')
      if (storedPharmacies) {
        disponibilityPharmacies.value = JSON.parse(storedPharmacies)
      }

      // Récupérer l'état de chargement
      const storedLoading = localStorage.getItem('is_loading')
      if (storedLoading) {
        isLoadingDisponibilite.value = storedLoading === 'true'
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des données de l'app:", error)
      // En cas d'erreur, nettoyer les données corrompues
      clearDisponibilityData()
      clearSelectedProduct()
    }
  }

  function reset() {
    clearDisponibilityData()
    clearSelectedProduct()
    setLoadingDisponibilite(false)
    setGlobalLoading(false)
  }

  return {
    // State
    selectedProduct,
    disponibilityPharmacies,
    isLoadingDisponibilite,
    isGlobalLoading,

    // Getters
    hasSelectedProduct,
    hasDisponibilityData,

    // Actions
    setSelectedProduct,
    setDisponibilityPharmacies,
    setLoadingDisponibilite,
    setGlobalLoading,
    clearDisponibilityData,
    clearSelectedProduct,
    initializeFromStorage,
    reset,
  }
})
