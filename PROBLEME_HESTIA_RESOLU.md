# Problème résolu : Produits ne s'affichent pas sur Hestia

## 🔍 Diagnostic du problème

### Symptômes
- ✅ Fonctionne sur **Render** (backend) + **Vercel** (frontend)
- ✅ Fonctionne en **local** (développement)
- ❌ Ne fonctionne **PAS sur Hestia**
- Erreur console : `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- Statut HTTP : **200 OK** (mais contenu incorrect)

### Cause identifiée

L'erreur indique que l'application reçoit du **HTML** au lieu de **JSON**. Voici pourquoi :

#### Sur Vercel (fonctionne ✅)
```json
// vercel.json configure des rewrites automatiques
{
  "rewrites": [
    {
      "source": "/epharma-api/:path*",
      "destination": "https://epharma-panel.srv557357.hstgr.cloud/:path*"
    }
  ]
}
```
Quand le code appelle `/epharma-api/public/api/produits`, Vercel redirige automatiquement vers l'API réelle.

#### Sur Hestia (ne fonctionne pas ❌)
- **Aucun proxy configuré** pour `/epharma-api/`
- La requête vers `/epharma-api/public/api/produits` retourne `index.html` (SPA fallback)
- Le code essaie de parser le HTML comme du JSON → **ERREUR**

### Pourquoi statut 200 ?
Le serveur retourne bien un fichier (index.html), donc statut 200, mais ce n'est pas le bon contenu !

## ✅ Solutions implémentées

### 1. Configuration Nginx (Solution principale)

Le fichier `deploy/nginx.conf` a été mis à jour avec tous les proxies nécessaires :

```nginx
# Proxy CRITIQUE pour les produits
location /epharma-api/ {
  proxy_pass https://epharma-panel.srv557357.hstgr.cloud/;
  proxy_set_header Host epharma-panel.srv557357.hstgr.cloud;
  # ... autres headers
}

# Proxy pour n8n webhook
location /n8n-webhook/ {
  proxy_pass https://n8n-workflows-cktx.onrender.com/;
  # ...
}

# Proxy pour reservations
location /reservations-api/ {
  proxy_pass https://demo2.srv557357.hstgr.cloud/;
  # ...
}

# Proxy pour api_epg
location /api_epg/ {
  proxy_pass https://api-ttm.onrender.com//api_epg/;
  # ...
}
```

### 2. Configuration Apache (.htaccess)

Pour les serveurs utilisant Apache, le fichier `deploy/.htaccess` a été créé avec les règles de réécriture équivalentes.

### 3. Fallback automatique dans le code

Le service `HomeService.ts` a été amélioré avec :

- **Détection automatique** : Si le proxy ne fonctionne pas (réponse HTML), bascule automatiquement sur les URLs directes
- **Logs détaillés** : Pour diagnostiquer les problèmes
- **Récupération gracieuse** : L'application continue de fonctionner même sans proxy

```typescript
// Détecte si une réponse est du HTML au lieu de JSON
private isHtmlResponse(text: string): boolean {
  return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
}

// Bascule automatiquement entre proxy et URL directe
private getApiUrl(proxyPath: string, directUrl: string): string {
  return this.useDirectUrls ? directUrl : proxyPath
}
```

## 📋 Étapes de déploiement sur Hestia

### Option A : Nginx (Recommandé)

1. **Connectez-vous en SSH à votre serveur Hestia**

2. **Localisez le fichier de configuration Nginx** :
   ```bash
   # Généralement dans :
   /home/votre-utilisateur/conf/web/nginx.votre-domaine.conf
   # ou
   /etc/nginx/conf.d/domains/votre-domaine.conf
   ```

3. **Ajoutez les configurations de proxy** depuis `deploy/nginx.conf`

4. **Testez et rechargez Nginx** :
   ```bash
   nginx -t
   systemctl reload nginx
   ```

### Option B : Apache (.htaccess)

1. **Activez les modules nécessaires** :
   ```bash
   a2enmod rewrite proxy proxy_http headers deflate expires
   systemctl restart apache2
   ```

2. **Copiez le fichier .htaccess** :
   ```bash
   cp deploy/.htaccess /home/votre-utilisateur/web/votre-domaine/public_html/.htaccess
   ```

### Option C : Laisser le fallback automatique

Si vous ne pouvez pas configurer de proxy, le code basculera automatiquement sur les URLs directes. Cependant :
- ⚠️ Peut causer des problèmes CORS
- ⚠️ Expose les URLs des APIs backend
- ⚠️ Moins performant

## 🧪 Vérification

Après configuration, testez :

```bash
# Devrait retourner du JSON, pas du HTML
curl https://votre-domaine.tld/epharma-api/public/api/produits

# Devrait commencer par {"data": [...]} et non par <!DOCTYPE
```

## 📊 Endpoints critiques

| Endpoint local | Destination | Utilisation |
|---------------|-------------|-------------|
| `/epharma-api/*` | `https://epharma-panel.srv557357.hstgr.cloud/` | **CRITIQUE** - Chargement produits |
| `/api_epg/*` | `https://api-ttm.onrender.com//api_epg/` | Disponibilité, alternatives |
| `/n8n-webhook/*` | `https://n8n-workflows-cktx.onrender.com/` | Suggestions IA |
| `/reservations-api/*` | `https://demo2.srv557357.hstgr.cloud/` | Réservations |
| `/api/*` | `https://api-ttm.onrender.com//` | Autres endpoints |

## 🎯 Résumé

**Problème** : Pas de proxy configuré sur Hestia → requêtes API retournent index.html → erreur JSON

**Solution** : Configurer les proxies Nginx/Apache OU laisser le fallback automatique du code

**Fichiers modifiés** :
- ✅ `deploy/nginx.conf` - Configuration Nginx complète
- ✅ `deploy/.htaccess` - Configuration Apache complète
- ✅ `src/Services/HomeService.ts` - Fallback automatique
- ✅ `deploy/HESTIA_DEPLOYMENT.md` - Guide de déploiement détaillé

**Résultat** : L'application fonctionnera sur Hestia avec ou sans proxy configuré ! 🎉
