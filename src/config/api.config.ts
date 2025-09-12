import { ENV } from './environment'

// Configuration des URLs de l'API
const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: ENV.API_BASE_URL,

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

    // Produits
    PRODUCTS: {
      LIST: '/api_epg/all_products/1/10',
      DETAIL: (id: string | number) => `/products/${id}`,
      CATEGORIES: '/products/categories',
      SEARCH: '/products/search',
      CREATE: '/products',
      UPDATE: (id: string | number) => `/products/${id}`,
      DELETE: (id: string | number) => `/products/${id}`,
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

  // Timeout par défaut (en millisecondes)
  TIMEOUT: 10000,

  // Configuration des retry
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
} as const

export default API_CONFIG
