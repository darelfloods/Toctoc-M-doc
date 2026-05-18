import { HttpService } from './HttpService'
import { AuthService } from './AuthService'

export interface MyPayGaSubscribeResponse {
  request_status?: number | string
  message?: string
  success_url?: string
  fail_url?: string
  transaction?: unknown
  transaction_id?: number | string
}

export interface TransactionStatusResponse {
  status: 'pending' | 'success' | 'failed' | 'timeout' | 'cancelled' | 'not_found'
  message: string
  credits_added: boolean
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

  /**
   * GET /my_pay_ga/transaction_status/{transactionId}
   * Récupère le vrai statut de la transaction
   */
  static async getTransactionStatus(transactionId: number | string): Promise<TransactionStatusResponse> {
    AuthService.initializeAuth()
    const authToken = AuthService.getAuthToken()
    if (!authToken) throw new Error('Vous devez être connecté.')
    HttpService.setAuthToken(authToken)

    const res = await HttpService.get<TransactionStatusResponse>(
      `/my_pay_ga/transaction_status/${transactionId}`,
    )
    return res.data
  }
}
