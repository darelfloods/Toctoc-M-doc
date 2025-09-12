# 🔗 Intégration Webhook n8n - Documentation

## Vue d'ensemble

Le système intègre un webhook n8n pour fournir des alternatives de médicaments quand un produit n'est pas disponible dans la région de l'utilisateur.

## Configuration

### 🌐 Webhook URL
```
http://localhost:5678/webhook/659daf74-ca15-40e2-a52c-54054db41de6
```

### 🛠️ Proxy Vite
L'URL est accessible via le proxy Vite configuré :
```
/n8n/webhook/659daf74-ca15-40e2-a52c-54054db41de6
```

## Intégration dans le Code

### 📁 HomeService.ts
```typescript
async askN8nAlternatives(input: { 
  productName?: string; 
  province?: string; 
  cip?: string | number; 
  rawQuery?: string 
}): Promise<string | null>
```

**Fonctionnalités :**
- ⏱️ Timeout 5s maximum
- 🎯 Préfixe automatique : `"essayer plutôt avec l'alternative: "`
- 🧹 Nettoyage des markdown (`**` supprimés)
- 📝 Logs détaillés pour debugging
- 🔄 Gestion robuste des erreurs

### 📁 HomeView.vue - Points d'intégration

#### 1️⃣ **Produit indisponible dans la province** (ligne ~634)
```typescript
const n8nMsg = await homeService.askN8nAlternatives({ 
  productName: product.libelle, 
  province: provinceKey, 
  cip: product.cip 
})
```

#### 2️⃣ **Aucune pharmacie trouvée** (ligne ~680)
```typescript
const n8nMsg = await homeService.askN8nAlternatives({ 
  productName: product?.libelle, 
  province: province || selectedProvince.value || undefined, 
  cip: product?.cip 
})
```

## Payload Webhook

### 📤 Format d'envoi
```json
{
  "medicament": "Paracetamol",
  "province": "Estuaire",
  "cip": "123456",
  "query": "alternatives pour Paracetamol",
  "timestamp": "2025-01-09T19:30:45.123Z"
}
```

### 📥 Format de réponse attendu
```json
{
  "alternative": "Doliprane 500mg disponible en pharmacie centrale"
}
```

**Autres formats supportés :**
- `reply`, `text`, `message`, `output`, `content`, `answer`, `result`, `response`
- Réponse texte simple
- Structures imbriquées : `data.alternative`, `result.text`, etc.

## Tests et Debugging

### 🧪 Tests en Console (Mode Développement)

```javascript
// Test rapide du webhook
await testN8nWebhook('Paracetamol', 'Estuaire')

// Test complet avec utilitaire
await testWebhook('Efferalgan')

// Vérifier disponibilité
await checkWebhook()
```

### 📊 Logs de Debugging

**HomeService :**
```
[HomeService] 🔍 Asking n8n alternatives for: Paracetamol in province: Estuaire
[HomeService] 📤 Sending webhook request with payload: {...}
[HomeService] 📥 Webhook JSON response: {...}
[HomeService] ✅ Webhook alternative found: essayer plutôt avec l'alternative: ...
```

**HomeView (AI Flow) :**
```
[AI Flow] 🔍 Searching alternatives via n8n webhook...
[AI Flow] ✅ Alternative found via webhook
```

## Gestion d'Erreurs

### ⚠️ Scénarios gérés
- **404 Not Found** : Webhook n8n indisponible
- **Timeout (5s)** : n8n ne répond pas assez vite
- **Erreur réseau** : n8n arrêté ou proxy défaillant
- **Réponse invalide** : Format de réponse non reconnu

### 🛡️ Fallbacks
- Si webhook échoue : Message générique "Aucune alternative trouvée"
- Pas de blocage de l'interface utilisateur
- Logs d'erreur détaillés dans la console

## Flux Utilisateur

### 1. **Recherche Normale**
```
Utilisateur → Recherche médicament → Disponible → Réservation ✅
```

### 2. **Avec Alternative n8n**
```
Utilisateur → Recherche médicament → Indisponible → Webhook n8n → Alternative affichée ✅
```

### 3. **Webhook Indisponible**
```
Utilisateur → Recherche médicament → Indisponible → Webhook ❌ → Message générique ✅
```

## Message Final Utilisateur

### ✅ **Succès**
```
Le produit n'est pas disponible dans Estuaire.

essayer plutôt avec l'alternative: Doliprane 500mg disponible en pharmacie centrale
```

### ❌ **Échec**
```
Le produit n'est pas disponible dans votre zone pour le moment.

Aucune alternative trouvée pour le moment.
```

## Configuration n8n

### 🔧 Workflow n8n requis
- **Webhook Node** : URL `/webhook/659daf74-ca15-40e2-a52c-54054db41de6`
- **Method** : POST
- **Response** : JSON avec champ `alternative`

### 📋 Exemple de configuration n8n
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "659daf74-ca15-40e2-a52c-54054db41de6",
        "httpMethod": "POST"
      }
    }
  ]
}
```

## Performance

- **Timeout** : 5 secondes maximum
- **Async** : Non bloquant pour l'interface
- **Cache** : Pas de cache (réponses contextuelles)
- **Parallélisme** : Un webhook par recherche

## Sécurité

- ✅ Sanitisation des données envoyées
- ✅ Timeout pour éviter les blocages
- ✅ Pas de données sensibles dans les logs
- ✅ Gestion robuste des erreurs
- ✅ Fallback gracieux

---

## 🚀 Quick Start

1. **Démarrer n8n** : `http://localhost:5678`
2. **Configurer le webhook** : `/webhook/659daf74-ca15-40e2-a52c-54054db41de6`
3. **Tester** : `testN8nWebhook()` dans la console
4. **Observer** : Logs dans DevTools pendant l'utilisation

L'intégration est maintenant **prête à l'emploi** ! 🎉