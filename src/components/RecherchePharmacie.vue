<template>
  <div v-if="visible">
    <div class="modal fade show" tabindex="-1" style="display:block;" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Recherche de pharmacie</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 d-flex align-items-center gap-2">
              <input type="text" class="form-control" v-model="localQuery" @input="onInput" placeholder="Rechercher..." />
              <span class="badge bg-primary">{{ results?.length || 0 }} résultat(s)</span>
            </div>
            <div v-if="loading" class="d-flex align-items-center gap-2">
              <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
              <strong>Chargement...</strong>
            </div>
            <div v-else-if="!results?.length" class="alert alert-warning mb-0">
              Aucun résultat pour cette recherche.
            </div>
            <div v-else class="list-group">
              <div v-for="(item, i) in results" :key="i" class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-semibold">{{ item?.libelle || 'Produit' }}</div>
                    <small class="text-muted" v-if="item?.cip">CIP: {{ item.cip }}</small>
                  </div>
                  <button class="btn btn-sm btn-outline-success" @click="$emit('select', item)">Vérifier disponibilité</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Fermer</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ visible: boolean; results: any[]; loading?: boolean; query?: string }>()
const emit = defineEmits(['close','select','queryChange'])

const localQuery = ref(props.query || '')

watch(() => props.query, (q) => {
  if (q !== undefined && q !== localQuery.value) {
    localQuery.value = q
  }
})

function onInput() {
  emit('queryChange', localQuery.value)
}
</script>

<style scoped>
/* Bootstrap modal classes cover the design */
</style>
