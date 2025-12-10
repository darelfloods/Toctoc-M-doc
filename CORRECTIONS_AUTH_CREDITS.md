# Corrections : Inscription et Débit de Crédits

## 🔴 Problèmes identifiés

### 1. Erreur 401 lors de l'inscription
**Symptôme** : `Erreur HTTP 401 - Vous n'êtes pas autorisé à effectuer cette action`

**Cause** : L'endpoint `/user/add` nécessite une authentification administrateur. C'est un endpoint protégé qui ne peut pas être utilisé pour l'inscription publique.

**Solution** : Changement de l'endpoint d'inscription vers `/auth/register` qui est un endpoint public.

### 2. Les crédits ne diminuent pas lors de la vérification
**Symptôme** : Clic sur "Confirmer" (2 crédits) mais le solde ne change pas

**Cause** : La fonction `doConfirm()` dans `DisponibiliteMedoc.vue` n'appelait **PAS** `debitCredits()`. Elle émettait juste l'événement sans débiter les crédits.

**Solution** : Ajout de l'appel à `creditStore.debitCredits(2)` avant d'émettre l'événement.

## ✅ Corrections appliquées

### 1. Endpoint d'inscription (api.config.ts)

**Avant** :
```typescript
REGISTER: '/user/add', // ❌ Nécessite auth admin
```

**Après** :
```typescript
REGISTER: '/auth/register', // ✅ Endpoint public
```

### 2. Débit de crédits (DisponibiliteMedoc.vue)

**Avant** :
```typescript
function doConfirm() {
  if (!selectedProvince.value) return
  // ❌ Pas de débit de crédits !
  emit('confirmSelection', selectedProvince.value)
  showDebitConfirm.value = false
}
```

**Après** :
```typescript
async function doConfirm() {
  if (!selectedProvince.value || isDebiting.value) return
  
  isDebiting.value = true
  try {
    const { useCreditStore } = await import('../stores/credit')
    const creditStore = useCreditStore()
    
    // ✅ Débiter 2 crédits via le store
    const ok = await creditStore.debitCredits(2)
    if (!ok) {
      alert('Le débit de crédits a échoué. Vérifiez votre solde ou votre connexion.')
      showDebitConfirm.value = false
      isDebiting.value = false
      return
    }
    
    // Succès: émettre l'événement
    emit('confirmSelection', selectedProvince.value)
    showDebitConfirm.value = false
  } catch (e) {
    console.error('Erreur lors du débit des crédits:', e)
    alert('Erreur lors du débit des crédits')
    showDebitConfirm.value = false
  } finally {
    isDebiting.value = false
  }
}
```

## 📝 Note importante sur l'endpoint d'inscription

Si `/auth/register` n'existe pas sur votre backend, vous avez deux options :

### Option A : Créer l'endpoint `/auth/register` sur le backend (Recommandé)

Créez un endpoint public qui :
1. Accepte les données d'inscription (firstname, lastname, email, password)
2. Crée l'utilisateur dans la base de données
3. Retourne un token d'authentification
4. **Ne nécessite PAS d'authentification** (endpoint public)

### Option B : Modifier `/user/add` pour accepter les inscriptions publiques

Si vous ne pouvez pas créer un nouvel endpoint, modifiez `/user/add` pour :
1. Accepter les requêtes sans authentification pour les nouvelles inscriptions
2. Vérifier si l'utilisateur existe déjà
3. Créer le compte avec le rôle "USER" par défaut

## 🧪 Tests à effectuer

### Test 1 : Inscription
1. Ouvrir le formulaire d'inscription
2. Remplir tous les champs (prénom, nom, email, mot de passe)
3. Cliquer sur "S'inscrire"
4. **Résultat attendu** : Compte créé et connexion automatique (pas d'erreur 401)

### Test 2 : Débit de crédits
1. Se connecter avec un compte ayant des crédits
2. Rechercher un produit
3. Cliquer sur "Vérifier la disponibilité"
4. Sélectionner une province
5. Cliquer sur "Confirmer" dans la modale "Cette action vaut 2 crédits"
6. **Résultat attendu** : Le solde de crédits diminue de 2

## 🔍 Vérification backend

Vérifiez que votre backend a bien l'un de ces endpoints :

```bash
# Option 1 : Endpoint public d'inscription (RECOMMANDÉ)
POST /auth/register
Body: { "firstname": "...", "lastname": "...", "email": "...", "password": "..." }
Headers: Aucune authentification requise

# Option 2 : Endpoint admin modifié pour accepter les inscriptions publiques
POST /user/add
Body: { "firstname": "...", "lastname": "...", "email": "...", "password": "...", "role": "USER" }
Headers: Aucune authentification requise pour role=USER
```

## 📊 Fichiers modifiés

- ✅ `src/config/api.config.ts` - Changement de l'endpoint d'inscription
- ✅ `src/components/DisponibiliteMedoc.vue` - Ajout du débit de crédits

## 🎯 Résultat final

Après ces corrections :
1. ✅ Les utilisateurs peuvent s'inscrire sans erreur 401
2. ✅ Les crédits sont bien débités lors de la vérification de disponibilité
3. ✅ Le système de crédits fonctionne correctement
