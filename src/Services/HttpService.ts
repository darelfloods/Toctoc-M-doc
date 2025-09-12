import API_CONFIG from '@/config/api.config'

// Types pour les requêtes HTTP
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export interface ApiError {
  message: string
  status: number
  statusText: string
  data?: any
}

// Classe pour gérer les erreurs HTTP
export class HttpError extends Error {
  public status: number
  public statusText: string
  public data?: any

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

// Service HTTP principal
export class HttpService {
  // Token d'auth stocké localement pour éviter de muter API_CONFIG (readonly)
  private static authToken: string | null = null

  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, timeout = API_CONFIG.TIMEOUT } = options

    // Construction de l'URL complète
    const url = `${API_CONFIG.BASE_URL}${endpoint}`

    // Fusion des en-têtes (Record pour pouvoir ajouter Authorization dynamiquement)
    const requestHeaders: Record<string, string> = {
      ...(API_CONFIG.HEADERS as Record<string, string>),
      ...(headers || {}),
    }

    // Ajouter le header Authorization si un token est présent
    if (this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`
    }

    // Configuration de la requête
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    }

    // Ajout du body si nécessaire
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Pour FormData, ne pas stringifier et ne pas définir Content-Type
        requestOptions.body = body
        // Supprimer Content-Type pour laisser le navigateur le définir avec la boundary
        delete (requestHeaders as Record<string, string>)['Content-Type']
        console.log('📤 FormData envoyé:', body)
      } else {
        // Pour JSON, stringifier et définir Content-Type
        requestOptions.body = JSON.stringify(body)
        console.log('📤 Body JSON envoyé:', body)
        console.log('📤 Body JSON stringifié:', requestOptions.body)
      }
    }

    console.log('🌐 URL complète:', url)
    console.log('📋 Headers:', requestHeaders)
    console.log('🔧 Options de requête:', requestOptions)

    try {
      // Gestion du timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('📡 Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Vérification du statut de la réponse
      if (!response.ok) {
        // Lire une seule fois le corps de la réponse, puis parser si possible
        const raw = await response.text()
        let errorData: any
        try {
          errorData = raw ? JSON.parse(raw) : null
        } catch {
          errorData = raw
        }

        console.error('❌ Erreur HTTP:', errorData)

        throw new HttpError(
          (errorData && errorData.message) || `Erreur HTTP ${response.status}`,
          response.status,
          response.statusText,
          errorData,
        )
      }

      // Parsing de la réponse (lecture unique du corps)
      const contentType = response.headers.get('content-type') || ''
      const raw = await response.text()
      const data: T = contentType.includes('application/json')
        ? (raw ? JSON.parse(raw) : ({} as T))
        : (raw as unknown as T)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }

      const err = error as { name?: string; message?: string }
      if (err?.name === 'AbortError') {
        throw new HttpError('Timeout de la requête', 408, 'Request Timeout')
      }

      throw new HttpError(err?.message || 'Erreur réseau', 0, 'Network Error')
    }
  }

  // Méthodes HTTP
  static async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  static async post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  static async put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  static async patch<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  static async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // Méthode pour ajouter un token d'authentification
  static setAuthToken(token: string): void {
    this.authToken = token || null
  }

  // Méthode pour nettoyer le token d'authentification
  static clearAuthToken(): void {
    this.authToken = null
  }
}
