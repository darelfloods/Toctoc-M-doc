import { HttpService } from './HttpService'
import { AuthService } from './AuthService'

export interface MyPayGaResponse {
  request_status?: number
  message?: string
  [key: string]: any
}

export class MyPayGaService {
  static async subscribePricing(params: {
    phone: string
    amount: number | string
    lastname: string
    email: string
    rate_id: number
    network: string
    disable_auto_credit?: boolean
    frontend_managed?: boolean
  }): Promise<MyPayGaResponse> {
    // Le backend Angular appelle: /my_pay_ga/subscribe_pricing
    // avec: client_phone, amount, lastname, rate_id, email, network
    const payload = {
      client_phone: params.phone,
      amount: String(params.amount),
      lastname: params.lastname,
      rate_id: params.rate_id,
      email: params.email,
      network: params.network,
      // Nouveaux paramètres pour contrôler l'auto-crédit
      ...(params.disable_auto_credit && { disable_auto_credit: true }),
      ...(params.frontend_managed && { frontend_managed: true }),
    }

    // Vérifier que le token d'authentification est présent
    const authToken = AuthService.getAuthToken()
    const currentUser = AuthService.getCurrentUser()
    
    console.log('🔐 [MyPayGa] === VÉRIFICATION AUTHENTIFICATION ===')
    console.log('🔐 [MyPayGa] Token présent:', !!authToken)
    console.log('🔐 [MyPayGa] Token complet:', authToken)
    console.log('🔐 [MyPayGa] Token (tronqué):', authToken ? `${authToken.substring(0, 30)}...` : 'AUCUN')
    console.log('👤 [MyPayGa] Utilisateur:', currentUser)
    console.log('👤 [MyPayGa] Email:', currentUser?.email)
    console.log('🎭 [MyPayGa] Rôle utilisateur:', currentUser?.role)

    if (!authToken) {
      console.error('❌ [MyPayGa] Aucun token d\'authentification trouvé')
      console.error('❌ [MyPayGa] Veuillez vous déconnecter et vous reconnecter')
      throw new Error('Vous devez être connecté pour effectuer un paiement. Veuillez vous reconnecter.')
    }

    // S'assurer que le token est bien configuré dans HttpService
    console.log('🔧 [MyPayGa] Configuration du token dans HttpService...')
    HttpService.setAuthToken(authToken)
    console.log('✅ [MyPayGa] Token configuré avec succès')
    console.log('✅ [MyPayGa] Prêt pour le paiement')

    console.log('📞 [MyPayGa] Appel API /my_pay_ga/subscribe_pricing')
    console.log('📦 [MyPayGa] Payload:', payload)

    try {
      // Timeout de 120 secondes pour les paiements Mobile Money (plus long que la normale)
      const res = await HttpService.post<MyPayGaResponse>(
        '/my_pay_ga/subscribe_pricing',
        payload,
        { timeout: 120000 }
      )
      console.log('✅ [MyPayGa] Réponse API:', res.data)
      console.log('✅ [MyPayGa] request_status:', res.data.request_status)
      console.log('✅ [MyPayGa] message:', res.data.message)
      return res.data as unknown as MyPayGaResponse
    } catch (error: any) {
      console.error('❌ [MyPayGa] Erreur API:', error)
      console.error('❌ [MyPayGa] Status:', error?.status)
      console.error('❌ [MyPayGa] Message:', error?.message)
      console.error('❌ [MyPayGa] Data:', error?.data)
      throw error
    }
  }
}
