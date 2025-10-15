<template>
  <div v-if="visible">
    <div class="modal fade show" id="pharmacies" tabindex="-1" aria-labelledby="pharmaciesLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content modern-modal">
          <!-- Enhanced Header -->
          <div class="modal-header modern-header">
            <div class="header-content">
              <div class="header-icon">
                <i class="bi bi-hospital"></i>
              </div>
              <div class="header-text">
                <h1 class="modal-title text-white" id="pharmaciesLabel">
                  Nos Pharmacies Partenaires
                </h1>
                <p class="header-subtitle">
                  Réseau de {{ totalPharmacies }} pharmacies à travers le Gabon
                </p>
              </div>
            </div>
            <button type="button" class="btn-close modern-close" aria-label="Close" @click="$emit('close')">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body modern-body">
            <!-- Search Bar -->
            <div class="search-section">
              <div class="search-container">
                <i class="bi bi-search search-icon"></i>
                
                <div class="search-filters">
                  <select v-model="statusFilter" class="filter-select">
                    <option value="">Tous les statuts</option>
                    <option value="active">Actives</option>
                    <option value="inactive">Inactives</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Enhanced Statistics Summary -->
            <div class="stats-grid">
              <div class="stat-card total">
                <div class="stat-icon">
                  <i class="bi bi-building"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ totalPharmacies }}</div>
                  <div class="stat-label">Total Pharmacies</div>
                </div>
                <div class="stat-trend">
                  <i class="bi bi-graph-up"></i>
                </div>
              </div>
              
              <div class="stat-card active">
                <div class="stat-icon">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ activePharmacies }}</div>
                  <div class="stat-label">Actives</div>
                </div>
                <div class="stat-percentage">{{ Math.round((activePharmacies / totalPharmacies) * 100) }}%</div>
              </div>
              
              <div class="stat-card inactive">
                <div class="stat-icon">
                  <i class="bi bi-pause-circle-fill"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ inactivePharmacies }}</div>
                  <div class="stat-label">Inactives</div>
                </div>
                <div class="stat-percentage">{{ Math.round((inactivePharmacies / totalPharmacies) * 100) }}%</div>
              </div>
            </div>

            <!-- Enhanced Pharmacies Grid -->
            <div class="pharmacies-section">
              <div class="section-header">
                <h3>Liste des Pharmacies</h3>
                <div class="results-count">{{ filteredPharmacies.length }} résultat(s)</div>
              </div>
              
              <div class="pharmacies-grid">
                <div
                  v-for="(pharmacy, index) in filteredPharmacies"
                  :key="pharmacy.id || index"
                  class="pharmacy-card modern-card"
                  :class="{ 'active': pharmacy.status === 'active', 'inactive': pharmacy.status === 'inactive' }"
                >
                  <div class="card-header">
                    <div class="pharmacy-icon">
                      <i class="bi bi-building" v-if="pharmacy.type === 'main'"></i>
                      <i class="bi bi-hospital" v-else-if="pharmacy.type === 'hospital'"></i>
                      <i class="bi bi-heart-pulse" v-else-if="pharmacy.type === 'health'"></i>
                      <i class="bi bi-capsule" v-else-if="pharmacy.type === 'capsule'"></i>
                      <i class="bi bi-plus-circle-fill" v-else-if="pharmacy.type === 'plus'"></i>
                      <i class="bi bi-shield-heart" v-else-if="pharmacy.type === 'shield'"></i>
                      <i class="bi bi-building" v-else></i>
                    </div>
                    <div class="pharmacy-status">
                      <span class="status-badge" :class="pharmacy.status">
                        <i class="bi bi-circle-fill"></i>
                        {{ pharmacy.status === 'active' ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </div>

                  <div class="card-body">
                    <h6 class="pharmacy-name">{{ pharmacy.name }}</h6>
                    
                    <div class="pharmacy-details">
                      <div class="detail-item" v-if="pharmacy.address">
                        <i class="bi bi-geo-alt"></i>
                        <span>{{ pharmacy.address }}</span>
                      </div>
                      <div class="detail-item" v-if="pharmacy.province">
                        <i class="bi bi-map"></i>
                        <span>{{ pharmacy.province }}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer modern-footer">
            <div class="footer-info">
              <i class="bi bi-info-circle"></i>
              <span>Données mises à jour en temps réel</span>
            </div>
            <button type="button" class="btn btn-primary modern-btn" @click="$emit('close')">
              <i class="bi bi-x"></i>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Pharmacy {
  id?: string
  name: string
  type?: 'main' | 'hospital' | 'health' | 'capsule' | 'plus' | 'shield'
  status: 'active' | 'inactive'
  address?: string
  province?: string
}

defineProps<{
  visible: boolean
}>()

defineEmits<{
  close: []
}>()

// Sample pharmacy data - combines static partners with realistic data
const allPharmacies = computed<Pharmacy[]>(() => [
  // Main pharmacies from the carousel
  {
    id: '1',
    name: 'PHARMACIE CENTRALE',
    type: 'main',
    status: 'active',
    address: 'Avenue de l\'Indépendance, Libreville',
    province: 'Estuaire'
  },
  {
    id: '2',
    name: 'PHARMACIE MODERNE',
    type: 'hospital',
    status: 'active',
    address: 'Boulevard Triomphal, Libreville',
    province: 'Estuaire'
  },
  {
    id: '3',
    name: 'PHARMACIE SANTÉ',
    type: 'health',
    status: 'active',
    address: 'Quartier Nombakélé, Libreville',
    province: 'Estuaire'
  },
  {
    id: '4',
    name: 'PHARMACIE LA MANUFAC',
    type: 'capsule',
    status: 'inactive',
    address: 'Zone Industrielle Oloumi, Libreville',
    province: 'Estuaire'
  },
  {
    id: '5',
    name: 'PHARMACIE BON REMÈDE',
    type: 'plus',
    status: 'active',
    address: 'Centre-ville, Port-Gentil',
    province: 'Ogooué-Maritime'
  },
  {
    id: '6',
    name: 'PHARMACIE NOTRE DAME',
    type: 'shield',
    status: 'active',
    address: 'Quartier Cathédrale, Libreville',
    province: 'Estuaire'
  },
  // Partner pharmacies from the partenaires array
  {
    id: '7',
    name: 'PHARMACIE AYITEBE',
    status: 'active',
    address: 'Centre-ville, Franceville',
    province: 'Haut-Ogooué'
  },
  {
    id: '8',
    name: 'PHARMACIE AKEWA',
    status: 'active',
    address: 'Quartier Akewa, Oyem',
    province: 'Woleu-Ntem'
  },
  {
    id: '9',
    name: 'PHARMACIE SOS BIBIKI',
    status: 'inactive',
    address: 'Bibiki, Oyem',
    province: 'Woleu-Ntem'
  },
  {
    id: '10',
    name: 'PHARMACIE MARIE LAMLET',
    status: 'active',
    address: 'Lambaréné Centre',
    province: 'Moyen-Ogooué'
  },
  {
    id: '11',
    name: 'PHARMACIE LIBWE',
    status: 'active',
    address: 'Quartier Libwe, Mouila',
    province: 'Ngounié'
  },
  {
    id: '12',
    name: 'PHARMACIE EL RAPHA',
    status: 'inactive',
    address: 'Centre El Rapha, Tchibanga',
    province: 'Nyanga'
  },
  {
    id: '13',
    name: 'PHARMACIE MANIEVA',
    status: 'active',
    address: 'Quartier Manieva, Makokou',
    province: 'Ogooué-Ivindo'
  }
])

// Search and filter states
const searchQuery = ref('')
const statusFilter = ref('')

// Computed filtered pharmacies
const filteredPharmacies = computed(() => {
  let filtered = allPharmacies.value
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(pharmacy => 
      pharmacy.name.toLowerCase().includes(query) ||
      (pharmacy.address && pharmacy.address.toLowerCase().includes(query)) ||
      (pharmacy.province && pharmacy.province.toLowerCase().includes(query))
    )
  }
  
  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(pharmacy => pharmacy.status === statusFilter.value)
  }
  
  return filtered
})

const totalPharmacies = computed(() => allPharmacies.value.length)
const activePharmacies = computed(() => allPharmacies.value.filter(p => p.status === 'active').length)
const inactivePharmacies = computed(() => allPharmacies.value.filter(p => p.status === 'inactive').length)
</script>

<style scoped>
/* Modern Modal Styling */
.modern-modal {
  border: none;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* Enhanced Header */
.modern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 2rem;
  color: white;
  position: relative;
}

.modern-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  backdrop-filter: blur(10px);
}

.header-text .modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 1rem;
  font-weight: 400;
}

.modern-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.modern-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Modern Body */
.modern-body {
  padding: 2rem;
  background: #f8fafc;
}

/* Search Section */
.search-section {
  margin-bottom: 2rem;
}

.search-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: white;
  border-radius: 15px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.search-container:focus-within {
  border-color: #667eea;
  box-shadow: 0 4px 25px rgba(102, 126, 234, 0.15);
}

.search-icon {
  color: #64748b;
  font-size: 1.2rem;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 0.5rem 0;
  background: transparent;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  background: white;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
}

.filter-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Enhanced Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card.total::before {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.stat-card.active::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.stat-card.inactive::before {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-card.active .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-card.inactive .stat-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-weight: 500;
}

.stat-percentage {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
}

.stat-trend {
  color: #10b981;
  font-size: 1.2rem;
}

/* Pharmacies Section */
.pharmacies-section {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.results-count {
  background: #e2e8f0;
  color: #475569;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Enhanced Pharmacy Cards */
.pharmacies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.pharmacies-grid::-webkit-scrollbar {
  width: 6px;
}

.pharmacies-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.pharmacies-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.pharmacies-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.modern-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.modern-card.active {
  border-color: #10b981;
}

.modern-card.inactive {
  border-color: #ef4444;
  opacity: 0.8;
}

.card-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.pharmacy-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.modern-card.active .pharmacy-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.modern-card.inactive .pharmacy-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #991b1b;
}

.status-badge i {
  font-size: 0.6rem;
}

.card-body {
  padding: 1rem 1.5rem;
}

.pharmacy-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
  line-height: 1.3;
}

.pharmacy-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.detail-item i {
  color: #94a3b8;
  width: 16px;
  text-align: center;
}

.card-footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.action-btn.inactive {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.action-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

/* Modern Footer */
.modern-footer {
  background: #f8fafc;
  border: none;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.footer-info i {
  color: #94a3b8;
}

.modern-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.modern-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modern-header {
    padding: 1.5rem;
  }
  
  .header-content {
    gap: 1rem;
  }
  
  .header-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .header-text .modal-title {
    font-size: 1.5rem;
  }
  
  .modern-body {
    padding: 1.5rem;
  }
  
  .search-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .pharmacies-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .modern-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .modern-body {
    padding: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>