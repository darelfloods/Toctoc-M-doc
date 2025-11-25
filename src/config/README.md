# Configuration de l'API

Ce dossier contient la configuration pour gérer les appels API de votre application Vue.js.

## Structure des fichiers

- `environment.ts` - Variables d'environnement et configuration globale
- `api.config.ts` - Configuration des endpoints et paramètres de l'API
- `README.md` - Ce fichier de documentation

## Configuration de l'environnement

### 1. Créer un fichier `.env.local`

Créez un fichier `.env.local` à la racine de votre projet avec le contenu suivant :

```bash
# Configuration de l'API
VITE_API_BASE_URL=https://api-ttm.onrender.com/api

# Configuration de l'environnement
VITE_APP_ENV=development
```

### 2. Variables d'environnement disponibles

- `VITE_API_BASE_URL` : URL de base de votre API (défaut: `https://api-ttm.onrender.com/api`)
- `VITE_APP_ENV` : Environnement de l'application (défaut: `development`)

## Utilisation dans vos services

### Exemple avec ProductService

```typescript
import { HttpService } from '@/Services/HttpService'
import API_CONFIG from '@/config/api.config'

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    try {
      const response = await HttpService.get<Product[]>(API_CONFIG.ENDPOINTS.PRODUCTS.LIST)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error)
      throw new Error('Erreur de chargement des produits')
    }
  }
}
```

### Exemple avec AuthService

```typescript
import { HttpService } from '@/Services/HttpService'
import API_CONFIG from '@/config/api.config'

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await HttpService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials,
      )

      // Stocker le token
      if (response.data.token) {
        HttpService.setAuthToken(response.data.token)
      }

      return response.data
    } catch (error) {
      throw new Error('Échec de la connexion')
    }
  }
}
```

## Fonctionnalités du HttpService

### Méthodes HTTP disponibles

- `HttpService.get<T>(endpoint, options?)` - Requête GET
- `HttpService.post<T>(endpoint, body, options?)` - Requête POST
- `HttpService.put<T>(endpoint, body, options?)` - Requête PUT
- `HttpService.patch<T>(endpoint, body, options?)` - Requête PATCH
- `HttpService.delete<T>(endpoint, options?)` - Requête DELETE

### Gestion des erreurs

Le service gère automatiquement :

- Les timeouts (défaut: 10 secondes)
- Les erreurs HTTP
- Les erreurs réseau
- Le parsing des réponses JSON

### Authentification

```typescript
// Définir un token d'authentification
HttpService.setAuthToken('votre-token-jwt')

// Nettoyer le token
HttpService.clearAuthToken()
```

## Configuration des endpoints

Tous les endpoints sont centralisés dans `api.config.ts` :

```typescript
ENDPOINTS: {
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string | number) => `/products/${id}`,
    DELETE: (id: string | number) => `/products/${id}`,
  },
  // ... autres endpoints
}
```

## Gestion des environnements

### Développement

```bash
VITE_API_BASE_URL=https://api-ttm.onrender.com/api
```

### Production

```bash
VITE_API_BASE_URL=https://api.votre-domaine.com/api
```

### Staging

```bash
VITE_API_BASE_URL=https://staging-api.votre-domaine.com/api
```

## Bonnes pratiques

1. **Toujours utiliser le HttpService** au lieu de `fetch` directement
2. **Centraliser les endpoints** dans `api.config.ts`
3. **Gérer les erreurs** avec try/catch dans vos services
4. **Utiliser les types TypeScript** pour typer vos réponses API
5. **Tester vos endpoints** avant de les utiliser en production

## Dépannage

### L'API ne répond pas

- Vérifiez que `VITE_API_BASE_URL` est correct
- Vérifiez que votre serveur API est démarré
- Vérifiez les logs de la console pour les erreurs

### Erreurs CORS

- Configurez votre serveur API pour accepter les requêtes depuis votre domaine
- Vérifiez que les en-têtes sont correctement configurés

### Timeout des requêtes

- Ajustez `TIMEOUT` dans `api.config.ts` si nécessaire
- Vérifiez la performance de votre API
