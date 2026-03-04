import { HttpService } from './HttpService'

export class BackendTestService {
  /**
   * Test la connexion au backend TTM local
   */
  static async testConnection(): Promise<{ status: 'ok' | 'error', message: string, data?: any }> {
    try {
      console.log('🔗 Test de connexion au backend TTM...')


      // Test de la route racine du backend TTM
      const response = await HttpService.get('/')

      console.log('✅ Connexion réussie:', response.data)

      return {
        status: 'ok',
        message: 'Connexion au backend TTM local réussie',
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Erreur de connexion au backend TTM local:', error)

      return {
        status: 'error',
        message: `Erreur de connexion: ${error.message || error}`,
        data: error
      }
    }
  }

  /**
   * Test la route d'authentification
   */
  static async testAuthEndpoint(): Promise<{ status: 'ok' | 'error', message: string }> {
    try {
      console.log('🔐 Test de l\'endpoint d\'authentification...')

      // Tentative de connexion avec des credentials invalides pour vérifier que l'endpoint répond
      const formData = new FormData()
      formData.append('username', 'test@test.com')
      formData.append('password', 'testpassword')

      await HttpService.post('/auth/login', formData)

      return {
        status: 'ok',
        message: 'Endpoint d\'authentification accessible'
      }
    } catch (error: any) {
      // Si on obtient une erreur 401, c'est bon signe - l'endpoint fonctionne
      if (error.response?.status === 401) {
        return {
          status: 'ok',
          message: 'Endpoint d\'authentification accessible (erreur 401 attendue)'
        }
      }

      console.error('❌ Erreur sur l\'endpoint d\'authentification:', error)

      return {
        status: 'error',
        message: `Erreur sur l'endpoint d'authentification: ${error.message || error}`
      }
    }
  }

  /**
   * Affiche les informations de configuration actuelle
   */
  static getConfigInfo(): { environment: string, apiBaseUrl: string, proxyConfigured: boolean } {
    return {
      environment: import.meta.env.MODE,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://backend.srv1079351.hstgr.cloud/',
      proxyConfigured: import.meta.env.DEV // Le proxy n'est actif qu'en mode dev
    }
  }
}