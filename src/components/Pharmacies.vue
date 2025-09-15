<template>
  <div v-if="visible">
    <div class="modal fade show" id="pharmacies" tabindex="-1" aria-labelledby="pharmaciesLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h1 class="modal-title d-flex align-items-center" id="pharmaciesLabel">
              <i class="bi bi-hospital me-3" style="color: var(--primary-color);"></i>
              Toutes nos Pharmacies Partenaires
            </h1>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
          </div>

          <div class="modal-body p-4">
            <div class="mb-4">
              <p class="lead text-muted">
                Découvrez toutes nos pharmacies partenaires et leur statut de disponibilité en temps réel.
              </p>
            </div>

            <!-- Statistics Summary -->
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="stat-card-pharmacy">
                  <div class="stat-number">{{ totalPharmacies }}</div>
                  <div class="stat-label">Total Pharmacies</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="stat-card-pharmacy active">
                  <div class="stat-number">{{ activePharmacies }}</div>
                  <div class="stat-label">Actives</div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="stat-card-pharmacy inactive">
                  <div class="stat-number">{{ inactivePharmacies }}</div>
                  <div class="stat-label">Inactives</div>
                </div>
              </div>
            </div>

            <!-- Pharmacies Grid -->
            <div class="pharmacies-grid">
              <div
                v-for="(pharmacy, index) in allPharmacies"
                :key="pharmacy.id || index"
                class="pharmacy-card"
                :class="{ 'active': pharmacy.status === 'active', 'inactive': pharmacy.status === 'inactive' }"
              >
                <div class="pharmacy-icon">
                  <i class="bi bi-building" v-if="pharmacy.type === 'main'"></i>
                  <i class="bi bi-hospital" v-else-if="pharmacy.type === 'hospital'"></i>
                  <i class="bi bi-heart-pulse" v-else-if="pharmacy.type === 'health'"></i>
                  <i class="bi bi-capsule" v-else-if="pharmacy.type === 'capsule'"></i>
                  <i class="bi bi-plus-circle-fill" v-else-if="pharmacy.type === 'plus'"></i>
                  <i class="bi bi-shield-heart" v-else-if="pharmacy.type === 'shield'"></i>
                  <i class="bi bi-building" v-else></i>
                </div>

                <h6 class="pharmacy-name">{{ pharmacy.name }}</h6>

                <div class="pharmacy-info">
                  <div class="pharmacy-address" v-if="pharmacy.address">
                    <i class="bi bi-geo-alt me-1"></i>
                    {{ pharmacy.address }}
                  </div>
                  <div class="pharmacy-province" v-if="pharmacy.province">
                    <i class="bi bi-map me-1"></i>
                    {{ pharmacy.province }}
                  </div>
                </div>

                <div class="pharmacy-status">
                  <span class="status-badge" :class="pharmacy.status">
                    <i class="bi bi-circle-fill me-1"></i>
                    {{ pharmacy.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div class="modal-footer border-0">
            <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">
              <i class="bi bi-x-lg me-2"></i>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const totalPharmacies = computed(() => allPharmacies.value.length)
const activePharmacies = computed(() => allPharmacies.value.filter(p => p.status === 'active').length)
const inactivePharmacies = computed(() => allPharmacies.value.filter(p => p.status === 'inactive').length)
</script>

<style scoped>
.pharmacies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.8rem;
  max-height: 60vh;
  overflow-y: auto;
}

.pharmacy-card {
  background: white;
  border-radius: 6px;
  padding: 0.8rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
}

.pharmacy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.pharmacy-card.active {
  border-color: #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
}

.pharmacy-card.inactive {
  border-color: #dc3545;
  background: linear-gradient(135deg, #fff8f8 0%, #ffffff 100%);
  opacity: 0.8;
}

.pharmacy-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  color: white;
  font-size: 14px;
}

.pharmacy-card.active .pharmacy-icon {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}

.pharmacy-card.inactive .pharmacy-icon {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.pharmacy-name {
  font-weight: bold;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.2;
}

.pharmacy-info {
  margin-bottom: 0.5rem;
}

.pharmacy-address, .pharmacy-province {
  font-size: 0.72rem;
  color: #6c757d;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  line-height: 1.1;
}

.pharmacy-status {
  text-align: center;
  margin-bottom: 0;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}


.stat-card-pharmacy {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.stat-card-pharmacy:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-card-pharmacy.active {
  border-color: #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
}

.stat-card-pharmacy.inactive {
  border-color: #dc3545;
  background: linear-gradient(135deg, #fff8f8 0%, #ffffff 100%);
}

.stat-card-pharmacy .stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-card-pharmacy.active .stat-number {
  color: #28a745;
}

.stat-card-pharmacy.inactive .stat-number {
  color: #dc3545;
}

.stat-card-pharmacy .stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive design */
@media (max-width: 768px) {
  .pharmacies-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.6rem;
  }

  .pharmacy-card {
    padding: 0.6rem;
  }

  .pharmacy-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
    margin: 0 auto 0.3rem;
  }

  .pharmacy-name {
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
  }

  .pharmacy-address, .pharmacy-province {
    font-size: 0.65rem;
    margin-bottom: 0.15rem;
  }

  .status-badge {
    font-size: 0.6rem;
    padding: 0.15rem 0.4rem;
  }
}

@media (max-width: 480px) {
  .pharmacies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.3rem;
  }

  .pharmacy-card {
    padding: 0.3rem;
  }

  .pharmacy-icon {
    width: 20px;
    height: 20px;
    font-size: 10px;
    margin: 0 auto 0.2rem;
  }

  .pharmacy-name {
    font-size: 0.6rem;
    margin-bottom: 0.2rem;
  }

  .pharmacy-address, .pharmacy-province {
    font-size: 0.55rem;
    margin-bottom: 0.1rem;
  }

  .status-badge {
    font-size: 0.5rem;
    padding: 0.1rem 0.3rem;
  }
}
</style>