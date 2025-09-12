# Migration vers Pinia - Documentation

## Vue d'ensemble

Ce projet a été migré de l'utilisation directe de `localStorage` vers **Pinia** pour la gestion d'état. Pinia est la solution officielle recommandée pour Vue 3 et offre une meilleure gestion de l'état, une meilleure performance et une meilleure expérience de développement.

## Changements effectués

### 1. Nouveaux stores Pinia créés

#### `useAuthStore` - Gestion de l'authentification

- **État** : `user`, `token`, `isAuthenticated`, `isLoading`
- **Getters** : `currentUser`, `authToken`, `isLoggedIn`
- **Actions** : `login`, `logout`, `setUser`, `setToken`, `initializeFromStorage`

#### `useAppStore` - Données temporaires de l'application

- **État** : `selectedProduct`, `disponibilityPharmacies`, `isLoadingDisponibilite`
- **Getters** : `hasSelectedProduct`, `hasDisponibilityData`
- **Actions** : `setSelectedProduct`, `setDisponibilityPharmacies`, `clearDisponibilityData`

#### `useCartStore` - Gestion du panier (mis à jour)

- **État** : `items`
- **Getters** : `hasItems`, `total`, `itemCount`
- **Actions** : `addReservation`, `removeAt`, `updateQuantity`, `clear`

### 2. Services mis à jour

#### `AuthService`

- Utilise maintenant `useAuthStore` au lieu de `localStorage` directement
- Gestion centralisée de l'état d'authentification
- Support du rafraîchissement de token

#### `StorageService`

- **Déprécié** - Remplacé par les stores Pinia
- Peut être supprimé une fois la migration complète

### 3. Composants mis à jour

#### `HomeView.vue`

- Utilise `useAuthStore` et `useAppStore`
- État local remplacé par les stores Pinia
- Meilleure réactivité et gestion d'état

#### `Connexion.vue`

- Utilise `useAuthStore` pour la connexion
- Gestion d'état centralisée

#### `Parametre.vue`

- Utilise `useAuthStore` pour la déconnexion
- État utilisateur synchronisé avec le store

## Avantages de la migration

### ✅ Avantages

1. **État centralisé** : Toute la logique d'état est dans des stores dédiés
2. **Réactivité améliorée** : Changements automatiques dans tous les composants
3. **DevTools** : Support des Vue DevTools pour le debugging
4. **Performance** : Meilleure gestion des mises à jour et de la mémoire
5. **TypeScript** : Meilleur support des types et de l'autocomplétion
6. **Testabilité** : Plus facile de tester la logique métier

### 🔄 Persistance des données

- Les stores Pinia utilisent toujours `localStorage` en arrière-plan pour la persistance
- Les données sont automatiquement restaurées au redémarrage de l'application
- Gestion d'erreur robuste avec nettoyage automatique des données corrompues

## Utilisation dans vos composants

### Exemple d'utilisation du store d'authentification

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Vérifier si l'utilisateur est connecté
const isLoggedIn = computed(() => authStore.isLoggedIn)

// Récupérer l'utilisateur actuel
const currentUser = computed(() => authStore.currentUser)

// Déconnexion
function handleLogout() {
  authStore.logout()
}
</script>
```

### Exemple d'utilisation du store d'application

```vue
<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// Définir un produit sélectionné
function selectProduct(product: any) {
  appStore.setSelectedProduct(product)
}

// Récupérer l'état de chargement
const isLoading = computed(() => appStore.isLoadingDisponibilite)
</script>
```

## Migration des composants restants

Pour compléter la migration, vous devrez :

1. **Identifier** tous les composants qui utilisent encore `StorageService`
2. **Remplacer** les appels `StorageService` par les stores Pinia appropriés
3. **Tester** que la fonctionnalité reste identique
4. **Supprimer** `StorageService` une fois la migration complète

## Structure des fichiers

```
src/
├── stores/
│   ├── index.ts          # Export centralisé des stores
│   ├── auth.ts           # Store d'authentification
│   ├── app.ts            # Store des données d'application
│   └── cart.ts           # Store du panier
├── Services/
│   ├── AuthService.ts    # Service d'auth mis à jour
│   └── StorageService.ts # Déprécié (à supprimer)
└── components/
    ├── Connexion.vue     # Mis à jour pour Pinia
    ├── Parametre.vue     # Mis à jour pour Pinia
    └── ...
```

## Prochaines étapes

1. **Tester** la migration sur les composants déjà mis à jour
2. **Migrer** les composants restants
3. **Ajouter** des tests unitaires pour les stores
4. **Optimiser** la performance si nécessaire
5. **Documenter** les patterns d'utilisation pour l'équipe

## Support et questions

Si vous avez des questions sur la migration ou l'utilisation de Pinia, consultez :

- [Documentation officielle Pinia](https://pinia.vuejs.org/)
- [Guide de migration Vuex vers Pinia](https://pinia.vuejs.org/migrating-from-vuex.html)
- [Exemples d'utilisation avancée](https://pinia.vuejs.org/cookbook/)
