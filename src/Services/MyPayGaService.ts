import { HttpService } from './HttpService'
import { AuthService } from './AuthService'

export interface MyPayGaSubscribeResponse {
  request_status?: number | string
  message?: string
  success_url?: string
  fail_url?: string
  transaction?: unknown
  transaction_id?: string
}

export interface MyPayGaStatusResponse {
  transaction_id: string
  status: 'pending' | 'success' | 'failed' | 'timeout' | 'cancelled'
  message?: string
  credits_added?: boolean
}

/** Même contrat que ttm_front MyPayGa.service → POST /my_pay_ga/subscribe_pricing */
export class MyPayGaService {
  static async subscribePricing(params: {
    phone: string
    amount: number | string
    lastname?: string
    email?: string
    rate_id?: number
    network?: string
  }): Promise<MyPayGaSubscribeResponse> {
    AuthService.initializeAuth()
    const authToken = AuthService.getAuthToken()
    if (!authToken) throw new Error('Vous devez être connecté pour effectuer un paiement.')
    HttpService.setAuthToken(authToken)

    const payload = {
      client_phone: params.phone,
      amount: String(params.amount),
      lastname: params.lastname ?? 'Client',
      rate_id: params.rate_id ?? null,
      email: params.email ?? '',
      network: params.network ?? '',
    }

    const res = await HttpService.post<MyPayGaSubscribeResponse>(
      '/my_pay_ga/subscribe_pricing',
      payload,
      { timeout: 120000 },
    )
    return res.data
  }

  static async getStatus(transactionId: string): Promise<MyPayGaStatusResponse> {
    AuthService.initializeAuth()
    const authToken = AuthService.getAuthToken()
    if (!authToken) throw new Error('Vous devez être connecté pour vérifier le statut du paiement.')
    HttpService.setAuthToken(authToken)

    const res = await HttpService.get<MyPayGaStatusResponse>(`/payments/status/${encodeURIComponent(transactionId)}`)
    return res.data
  }
}
