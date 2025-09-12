# 🔧 Guide de Résolution du Problème Webhook n8n

## 🚨 **Problème Identifié**

Le webhook n8n répond correctement (status 200) mais retourne une réponse JSON vide, et n8n affiche "No prompt specified".

## 🎯 **Cause Root**

Le workflow n8n ne trouve pas le bon champ dans le payload JSON envoyé. Il cherche probablement un nom de champ spécifique.

## ✅ **Corrections Appliquées**

### 1. **Suppression de la méthode GET**
- ❌ Supprimé : Tentative GET (n8n ne l'accepte pas)  
- ✅ Gardé : Uniquement POST avec différents formats

### 2. **Formats de Payload Testés**
Le système teste maintenant automatiquement :
```javascript
[
  { prompt: message },      // Format le plus courant pour n8n
  { message: message },     // Format standard
  { text: message },        // Format texte simple
  { input: message },       // Format input
  { query: message },       // Format query
  { content: message },     // Format content
  { body: { message: message } }, // Format imbriqué
  { data: message },        // Format data
  message,                  // String direct
  {                        // Format avec métadonnées
    prompt: message,
    message: message,
    medicament: medicamentName,
    type: 'alternative_request'
  }
]
```

### 3. **Détection Intelligente des Réponses**
- ✅ Vérifie que la réponse n'est pas vide
- ✅ Vérifie qu'elle ne contient pas "No prompt specified"
- ✅ Vérifie une longueur minimale
- ✅ Affiche un aperçu de chaque tentative

## 🧪 **Outils de Test Disponibles**

### **Test Rapide**
```javascript
// Dans la console du navigateur
await quickWebhookTest('Paracetamol')
```

### **Test Complet**  
```javascript
// Pour diagnostic approfondi
await runWebhookDiagnostic('Paracetamol')
```

### **Test depuis HomeView**
```javascript  
// Test intégré
await testN8nWebhook('Paracetamol', 'Estuaire')
```

## 🎪 **Étapes de Débogage**

### 1. **Tester le Webhook Directement**
```bash
# Dans un terminal
curl -X POST http://localhost:5678/webhook/659daf74-ca15-40e2-a52c-54054db41de6 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "quel est l'alternatif de Paracetamol"}'
```

### 2. **Vérifier dans n8n**
- Ouvrir n8n : http://localhost:5678
- Vérifier que le workflow avec l'ID `659daf74-ca15-40e2-a52c-54054db41de6` existe
- Vérifier le nom du champ attendu par le Webhook Node

### 3. **Utiliser quickWebhookTest**
```javascript
await quickWebhookTest('Paracetamol')
```
Regarder les logs pour voir quelle format fonctionne.

## 🔍 **Logs à Surveiller**

### **Si ça fonctionne :**
```
[HomeService] ✅ Payload format 1 worked! Response: "Doliprane 500mg..."
[HomeService] ✅ Webhook alternative found: essayé avec l'alternative: Doliprane 500mg...
```

### **Si ça ne fonctionne pas :**
```
[HomeService] ⚠️ Format 1 response seems empty or invalid
[HomeService] ❌ All POST payload formats failed
```

## 🛠️ **Configuration n8n Recommandée**

### **Webhook Node**
- **HTTP Method**: POST
- **Path**: `659daf74-ca15-40e2-a52c-54054db41de6`
- **Response Mode**: Respond to Webhook

### **Champs à Vérifier**
Le webhook doit accepter l'un de ces champs :
- `{{ $json.prompt }}` ← **Le plus probable**
- `{{ $json.message }}`
- `{{ $json.text }}`
- `{{ $json.input }}`

## 🎯 **Action Recommandée**

1. **Lancez** : `await quickWebhookTest('Paracetamol')` dans la console
2. **Observez** les logs pour voir quel format fonctionne  
3. **Configurez n8n** pour utiliser le bon champ
4. **Testez** la réservation intelligente

Le système va automatiquement détecter le bon format et fonctionner ! 🚀

---

## 📋 **Checklist de Vérification**

- [ ] n8n fonctionne sur http://localhost:5678
- [ ] Le workflow avec l'ID `659daf74-ca15-40e2-a52c-54054db41de6` existe
- [ ] Le Webhook Node est configuré pour POST
- [ ] Le workflow utilise `{{ $json.prompt }}` ou `{{ $json.message }}`
- [ ] Test rapide : `quickWebhookTest()` fonctionne
- [ ] Réservation intelligente retourne une alternative

Une fois tous les points cochés, l'intégration fonctionnera parfaitement ! ✅