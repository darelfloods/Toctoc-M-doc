# Configuration n8n - Gestion du Wake-up

## Problème
Render met en veille les services gratuits après 15 minutes d'inactivité. Le chatbot n8n devient donc inactif et ne répond pas aux premières requêtes.

## Solution Implémentée

### 1. Frontend (App.vue)
- **Ping initial** au chargement de l'application
- **Ping périodique** toutes les 10 minutes pour maintenir n8n éveillé
- Message de ping : `{ message: "__ping__", source: "app-wakeup" }`

### 2. Workflow n8n (À configurer)

Pour éviter que l'IA traite les pings comme des vrais messages, ajoute ce node **avant** l'AI Agent :

#### Node "Filter Ping Messages" (type: IF)
```
Conditions:
- Si {{ $json.body.message }} égale "__ping__"
- OU {{ $json.body.source }} égale "app-wakeup"

Actions:
- TRUE branch → Node "Respond Empty" (retourne {})
- FALSE branch → Continue vers AI Agent
```

#### Node "Respond Empty" (type: Respond to Webhook)
```json
{
  "reply": "pong",
  "timestamp": "{{ $now.toISO() }}"
}
```

### Architecture du workflow modifié

```
Webhook
   ↓
Filter Ping Messages (IF)
   ├─ TRUE → Respond Empty (pong)
   └─ FALSE → AI Agent → Format Response → Respond to Webhook
```

## Alternative Simple

Si tu ne veux pas modifier le workflow, le ping sera traité comme un message normal mais :
- L'IA recevra "__ping__" et répondra quelque chose de générique
- Ce n'est pas grave car c'est silencieux (pas affiché à l'utilisateur)
- L'important est que n8n reste éveillé

## Bénéfices

✅ **Première requête rapide** : n8n déjà réveillé quand l'utilisateur pose sa première question
✅ **Service actif** : Ping toutes les 10 min garde n8n éveillé
✅ **Expérience utilisateur** : Pas de délai de 30-60s sur la première interaction
✅ **Silencieux** : Les pings ne sont pas visibles pour l'utilisateur

## Test

1. Attends 20 minutes sans utiliser l'app
2. Recharge la page
3. Après ~5 secondes, n8n est réveillé
4. Pose une question au chatbot → Réponse instantanée ✨
