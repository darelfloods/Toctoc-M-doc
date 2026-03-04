import { HttpService } from './HttpService'
import API_CONFIG from '@/config/api.config'
import { ENV } from '@/config/environment'
import { useAuthStore } from '@/stores/auth'

export interface User {
  id: number
  email: string
  firstname: string
  lastname: string
  phone?: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  firstname: string
  lastname: string
  email: string
  password: string
  phone?: string
  role?: string
}

export interface AuthResponse {
  user: User
  token: Token
}

// Service d'authentification
export class AuthService {
  // Connexion utilisateur
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 Tentative de connexion directe au backend TTM...')
    console.log('📝 Credentials:', { username: credentials.username })

    // Convertir les credentials en FormData car l'API backend FastAPI l'attend avec OAuth2PasswordRequestForm
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    try {
      const response = await HttpService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        formData,
        {
          headers: {
            // Ne pas spécifier Content-Type, le navigateur le fait automatiquement pour FormData
          }
        }
      )

      console.log('✅ Réponse backend reçue:', response.data)

      // Utiliser le store Pinia pour gérer l'état
      const authStore = useAuthStore()

      // Adapter les données du backend pour le frontend
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: `${response.data.user.firstname || ''} ${response.data.user.lastname || ''}`.trim(),
        firstname: response.data.user.firstname,
        lastname: response.data.user.lastname,
        phone: response.data.user.phone,
        role: response.data.user.role
      }

      authStore.login(userData as any, response.data.token as any)

      // Stocker le token dans HttpService pour les futures requêtes
      if (response.data.token) {
        HttpService.setAuthToken(response.data.token.access_token)
      }

      return response.data
    } catch (error: any) {
      console.error('❌ Erreur de connexion backend TTM:', error)
      console.error('❌ Détails de l\'erreur:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        data: error?.data
      })
      throw error // Relancer l'erreur originale pour garder les détails
    }
  }

  // Connexion administrateur
  static async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 Tentative de connexion admin au backend TTM...')

    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    try {
      const response = await HttpService.post<AuthResponse>(
        '/auth/login_admin',
        formData,
        {
          headers: {
            // Ne pas spécifier Content-Type pour FormData
          }
        }
      )

      console.log('✅ Connexion admin réussie:', response.data)

      const authStore = useAuthStore()

      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: `${response.data.user.firstname || ''} ${response.data.user.lastname || ''}`.trim(),
        firstname: response.data.user.firstname,
        lastname: response.data.user.lastname,
        phone: response.data.user.phone,
        role: response.data.user.role
      }

      authStore.login(userData as any, response.data.token as any)

      if (response.data.token) {
        HttpService.setAuthToken(response.data.token.access_token)
      }

      return response.data
    } catch (error) {
      console.error('❌ Erreur de connexion admin backend TTM:', error)
      throw new Error('Échec de la connexion admin au backend TTM')
    }
  }

  // Inscription utilisateur
  static async register(userData: RegisterData): Promise<AuthResponse> {
    console.log('📝 Tentative d\'inscription au backend TTM...')

    try {
      // Préparer les données selon le schema UserSchema.Create du backend
      const payload = {
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || null,
        role: userData.role || 'USER', // Par défaut USER selon le backend
      }

      console.log('📤 Données d\'inscription:', { ...payload, password: '[HIDDEN]' })

      // IMPORTANT: Sauvegarder le token actuel et le retirer temporairement
      // car l'inscription est un endpoint PUBLIC qui ne doit pas avoir d'auth
      const currentToken = HttpService.getAuthToken()
      if (currentToken) {
        console.log('🔓 Retrait temporaire du token pour inscription publique')
        HttpService.clearAuthToken()
      }

      const response = await HttpService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        payload,
      )

      // Restaurer le token si nécessaire (au cas où)
      if (currentToken && !response.data.token) {
        HttpService.setAuthToken(currentToken)
      }

      console.log('✅ Inscription réussie:', response.data)

      // Le backend retourne maintenant un token après l'inscription
      if (response.data.token && response.data.user) {
        const authStore = useAuthStore()
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.firstname || ''} ${response.data.user.lastname || ''}`.trim(),
          firstname: response.data.user.firstname,
          lastname: response.data.user.lastname,
          phone: response.data.user.phone,
          role: response.data.user.role
        }

        authStore.login(userData as any, response.data.token as any)
        HttpService.setAuthToken(response.data.token.access_token)

        console.log('✅ Utilisateur connecté automatiquement après inscription')
      }

      return response.data
    } catch (error: any) {
      console.error('❌ Erreur d\'inscription backend TTM:', error)

      // Extraire le message d'erreur détaillé
      const errorMessage = error?.data?.detail || error?.message || 'Échec de l\'inscription au backend TTM'
      throw new Error(errorMessage)
    }
  }

  // Demander la réinitialisation de mot de passe par email (même route qu'Angular)
  static async forgotPassword(email: string): Promise<{ message?: string }> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.AUTH.RECOVERY_PASSWORD(email)
      // POST pour éviter les erreurs 405 (method not allowed) sur certains hébergements
      const response = await HttpService.post<{ message?: string }>(endpoint, {})
      return response.data
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error)
      throw new Error('Échec de la demande de réinitialisation de mot de passe')
    }
  }

  // Réinitialiser le mot de passe avec un token de réinitialisation
  static async resetPassword(token: string, newPassword: string): Promise<{ msg?: string }> {
    try {
      console.log('🔐 Réinitialisation du mot de passe avec token...')

      const response = await HttpService.post<{ msg?: string }>(
        '/user/reset-password',
        {
          token,
          new_password: newPassword
        }
      )

      console.log('✅ Mot de passe réinitialisé avec succès')
      return response.data
    } catch (error: any) {
      console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error)

      // Extraire le message d'erreur détaillé
      const errorMessage = error?.data?.detail || error?.message || 'Échec de la réinitialisation du mot de passe'
      throw new Error(errorMessage)
    }
  }

  // Mettre à jour le mot de passe (même logique que dans l'Angular EpharmaService.updateMdp)
  static async updatePassword(userId: number, newPassword: string): Promise<void> {
    try {
      const endpoint = `/user/update_password/${userId}?new_password=${encodeURIComponent(newPassword)}`
      await HttpService.put(endpoint, null)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error)
      throw new Error('Échec de la mise à jour du mot de passe')
    }
  }

  // Mettre à jour le profil utilisateur (parité avec Angular: PUT /user/update/{id})
  static async updateProfile(userId: number, payload: Record<string, any>): Promise<User> {
    try {
      // Harmoniser avec le backend (Angular envoie firstname/lastname)
      const apiPayload: Record<string, any> = { ...payload }
      if (typeof apiPayload.pseudo === 'string' && apiPayload.pseudo.trim().length > 0) {
        const raw = apiPayload.pseudo.trim()
        // Découper le pseudo en prénom/nom si possible, sinon tout dans lastname
        const [first, ...rest] = raw.split(/\s+/)
        const firstname = first || ''
        const lastname = rest.join(' ') || (first || '')
        // Ne pas écraser des valeurs explicitement fournies
        if (!('firstname' in apiPayload)) apiPayload.firstname = firstname
        if (!('lastname' in apiPayload)) apiPayload.lastname = lastname
        delete apiPayload.pseudo
      }
      // Inclure l'id si utile côté backend (certains handlers l'attendent dans le body)
      if (!('id' in apiPayload)) apiPayload.id = userId

      const response = await HttpService.put<User>(`/user/update/${userId}`, apiPayload)
      // Mettre à jour le store avec les nouvelles infos
      const authStore = useAuthStore()
      if (authStore.currentUser) {
        authStore.updateUser(response.data as any)
      }
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      throw new Error('Échec de la mise à jour du profil')
    }
  }

  // Déconnexion utilisateur
  static async logout(): Promise<void> {
    try {
      // Appeler l'API de déconnexion si nécessaire
      await HttpService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Utiliser le store Pinia pour gérer l'état
      const authStore = useAuthStore()
      authStore.logout()

      // Nettoyer le token dans HttpService
      HttpService.clearAuthToken()
    }
  }

  // Vérifier si l'utilisateur est authentifié
  static isAuthenticated(): boolean {
    const authStore = useAuthStore()
    return authStore.isLoggedIn
  }

  // Récupérer l'utilisateur actuel
  static getCurrentUser(): User | null {
    const authStore = useAuthStore()
    return authStore.currentUser
  }

  // Récupérer le token d'authentification
  static getAuthToken(): string | null {
    const authStore = useAuthStore()
    return authStore.authToken || null
  }

  // Initialiser l'authentification au démarrage de l'app
  static initializeAuth(): void {
    const authStore = useAuthStore()
    authStore.initializeFromStorage()

    // Si un token existe, l'ajouter à HttpService
    if (authStore.authToken) {
      HttpService.setAuthToken(authStore.authToken)
    }
  }

  // Rafraîchir le token
  static async refreshToken(): Promise<boolean> {
    try {
      const authStore = useAuthStore()
      if (!authStore.token?.refresh_token) {
        return false
      }

      const response = await HttpService.post<{ token: Token }>('/auth/refresh', {
        refresh_token: authStore.token.refresh_token,
      })

      if (response.data.token) {
        authStore.setToken(response.data.token)
        HttpService.setAuthToken(response.data.token.access_token)
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      return false
    }
  }
}
