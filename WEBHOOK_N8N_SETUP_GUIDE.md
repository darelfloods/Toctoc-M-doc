# 🔧 Guide de Configuration Webhook n8n - URGENT

## 🚨 **Problème Identifié**

Le webhook répond mais avec des **réponses vides**. Le workflow n8n existe mais n'est **pas configuré correctement**.

## ✅ **Solution : Configuration n8n**

### 1. **Accéder à n8n**
- Ouvrir : http://localhost:5678
- Se connecter si nécessaire

### 2. **Trouver le Workflow**
- Chercher l'ID : `659daf74-ca15-40e2-a52c-54054db41de6`
- Ou créer un nouveau workflow

### 3. **Configuration Webhook Node**

#### **Webhook Node Settings :**
```
HTTP Method: POST
Path: 659daf74-ca15-40e2-a52c-54054db41de6
Response Mode: Respond to Webhook
Response Data: JSON
```

#### **Workflow Structure Recommandée :**
```
[Webhook] → [Set Variable] → [AI/Logic Node] → [Respond to Webhook]
```

### 4. **Configuration Détaillée**

#### **Node 1 : Webhook**
```json
{
  "httpMethod": "POST",
  "path": "659daf74-ca15-40e2-a52c-54054db41de6",
  "responseMode": "respondToWebhook",
  "options": {}
}
```

#### **Node 2 : Set (Extraction des Données)**
```json
{
  "values": {
    "medicament": "={{ $json.prompt || $json.message || $json.text || $json.input }}"
  }
}
```

#### **Node 3 : Code/AI (Traitement)**
```javascript
// Exemple de logique simple
const medicament = $input.first().json.medicament;
const alternative = `Doliprane équivalent pour ${medicament}`;

return [{ json: { reply: alternative } }];
```

#### **Node 4 : Respond to Webhook**
```json
{
  "respondWith": "json",
  "responseBody": "={{ $json.reply }}"
}
```

## 🧪 **Test Direct avec URL de Test**

### **Option 1 : Commande curl**
```bash
# Test avec URL de test n8n
curl -X POST http://localhost:5678/webhook-test/659daf74-ca15-40e2-a52c-54054db41de6 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "quel est l'alternatif de Paracetamol"}'
```

### **Option 2 : Script de test automatique**
```bash
# Windows
./test-webhook.bat

# Linux/Mac
chmod +x test-webhook.sh
./test-webhook.sh
```

**Résultat attendu :**
```
Doliprane équivalent pour quel est l'alternatif de Paracetamol
```

## 🎯 **Configuration Minimale qui Fonctionne**

### **Workflow Simple (2 Nodes) :**

1. **Webhook Node**
   - Method: POST
   - Path: `659daf74-ca15-40e2-a52c-54054db41de6`

2. **Respond to Webhook Node**
   - Response: `Doliprane 500mg disponible en pharmacie`
   - Ou : `{{ "Alternative suggérée pour " + ($json.prompt || $json.message) }}`

## 📋 **Checklist de Vérification**

- [ ] n8n ouvert sur http://localhost:5678
- [ ] Workflow avec ID `659daf74-ca15-40e2-a52c-54054db41de6` existe
- [ ] Webhook Node configuré pour POST
- [ ] Respond to Webhook Node connecté
- [ ] Test curl fonctionne
- [ ] Réponse non-vide reçue

## ⚡ **Test Rapide**

Une fois n8n configuré, testez dans la console :

```javascript
await quickWebhookTest('Paracetamol')
```

Vous devriez voir :
```
✅ Webhook seems to be working!
🎯 Final message would be: essayé avec l'alternative: Doliprane 500mg disponible
```

## 🚀 **Action Immédiate**

1. **Ouvrir n8n** : http://localhost:5678
2. **Créer/configurer** le workflow avec l'ID `659daf74-ca15-40e2-a52c-54054db41de6`
3. **Tester avec curl** la commande ci-dessus
4. **Vérifier** que vous recevez une réponse non-vide
5. **Tester** dans l'application Vue

Le problème sera résolu dès que le workflow n8n sera correctement configuré ! 🎉