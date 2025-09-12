// Export de tous les stores Pinia
export { useAuthStore } from './auth'
export { useAppStore } from './app'
export { useCartStore } from './cart'

// Types exportés
export type { User, Token, LoginCredentials, RegisterData } from './auth'
export type { CartItem } from './cart'
