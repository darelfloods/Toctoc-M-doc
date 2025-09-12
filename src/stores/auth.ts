import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  email: string
  name: string
  role?: string
  // Ajoutez d'autres propriétés selon votre modèle utilisateur
}

export interface Token {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<Token | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // Getters
  const currentUser = computed(() => user.value)
  const authToken = computed(() => token.value?.access_token)
  const isLoggedIn = computed(() => isAuthenticated.value && !!token.value)

  // Actions
  function setUser(userData: User) {
    user.value = userData
    isAuthenticated.value = true
  }

  function setToken(tokenData: Token) {
    token.value = tokenData
    isAuthenticated.value = true
  }

  function login(userData: User, tokenData: Token) {
    setUser(userData)
    setToken(tokenData)
    // Persister dans localStorage pour la persistance entre sessions
    localStorage.setItem('auth_user', JSON.stringify(userData))
    localStorage.setItem('auth_token', JSON.stringify(tokenData))
  }

  function logout() {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    // Nettoyer localStorage
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_connected')
  }

  function initializeFromStorage() {
    try {
      const storedUser = localStorage.getItem('auth_user')
      const storedToken = localStorage.getItem('auth_token')

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser)
        const tokenData = JSON.parse(storedToken)

        // Vérifier si le token n'est pas expiré uniquement si expires_in est une date valide.
        // De nombreux backends fournissent un nombre de secondes (durée) ou un timestamp non ISO.
        // Pour éviter une déconnexion intempestive, on n'applique la vérification que si la valeur
        // se parse en Date valide (ISO ou format date supporté par new Date()).
        if (tokenData.expires_in) {
          const parsed = new Date(tokenData.expires_in)
          const expiresAt = parsed.getTime()
          if (!Number.isNaN(expiresAt)) {
            const now = Date.now()
            if (now > expiresAt) {
              logout()
              return
            }
          }
        }

        setUser(userData)
        setToken(tokenData)
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'authentification:", error)
      logout()
    }
  }

  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,

    // Getters
    currentUser,
    authToken,
    isLoggedIn,

    // Actions
    setUser,
    setToken,
    login,
    logout,
    initializeFromStorage,
    updateUser,
  }
})
