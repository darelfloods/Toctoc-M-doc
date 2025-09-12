import { HttpService } from './HttpService'

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
    const res = await HttpService.post<MyPayGaResponse>('/my_pay_ga/subscribe_pricing', payload)
    return res.data as unknown as MyPayGaResponse
  }
}
