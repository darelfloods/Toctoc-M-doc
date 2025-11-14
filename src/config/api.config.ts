import { ENV } from './environment'

// Configuration des URLs de l'API
const API_CONFIG = {
  // URL de base de l'API - vide en dev pour utiliser le proxy Vite
  BASE_URL: ENV.IS_DEV ? '' : ENV.API_BASE_URL,

  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/user/add',
      PROFILE: '/auth/me',
      LOGOUT: '/auth/logout',
      RECOVERY_PASSWORD: (email: string) => `/user/recovery_password/${email}`,
    },

    // Produits (EPG)
    PRODUCTS: {
      // Remarque: HomeService/ProductService paginent via paramètres dynamiques
      LIST: (page: string | number, count: string | number) => `/api_epg/all_products/${page}/${count}`,
      SEARCH: (libelle: string) => `/api_epg/products_by_search/${libelle}`,
      DISPONIBILITY: '/api_epg/disponibility_product',
      RESERVATION: '/api_epg/reservation',
    },

    // Utilisateurs
    USERS: {
      LIST: '/users',
      DETAIL: (id: string | number) => `/users/${id}`,
      CREATE: '/users',
      UPDATE: (id: string | number) => `/users/${id}`,
      DELETE: (id: string | number) => `/users/${id}`,
    },

    // Commandes
    ORDERS: {
      LIST: '/orders',
      DETAIL: (id: string | number) => `/orders/${id}`,
      CREATE: '/orders',
      UPDATE: (id: string | number) => `/orders/${id}`,
      STATUS: (id: string | number) => `/orders/${id}/status`,
    },
  },

  // Configuration des en-têtes par défaut
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  // Timeout par défaut (en millisecondes) - utilise ENV.API_TIMEOUT_MS
  TIMEOUT: ENV.API_TIMEOUT_MS,

  // Configuration des retry
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
} as const

export default API_CONFIG
