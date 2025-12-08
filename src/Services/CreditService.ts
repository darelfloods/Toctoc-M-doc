import { HttpService, HttpError } from './HttpService'

export interface AccountResponse {
  id: number
  credit?: number
  [key: string]: any
}

export interface PriceLibelleResponse {
  credit?: number
  rate_id?: string
  price?: number
  [key: string]: any
}

export class CreditService {
  private static lastError: string | null = null

  static getLastError(): string | null { return this.lastError }
  
  // Fonction utilitaire pour déterminer si une erreur est récupérable
  static isRecoverableError(error: string | null): boolean {
    if (!error) return true
    return !/HTTP\s+(401|403)/i.test(error)
  }
  
  // Fonction utilitaire pour formater les messages d'erreur utilisateur
  static formatUserError(error: string | null): string {
    if (!error) return "Erreur inconnue"
    
    if (/HTTP\s+404/i.test(error)) {
      return "Service temporairement indisponible"
    } else if (/HTTP\s+(401|403)/i.test(error)) {
      return "Session expirée"
    } else if (/HTTP\s+400/i.test(error)) {
      return "Données de compte invalides"
    } else if (/timeout|network/i.test(error)) {
      return "Problème de connexion"
    } else if (/HTTP\s+500/i.test(error)) {
      return "Erreur serveur temporaire"
    }
    
    return "Erreur technique"
  }
  static async getAccountByUserId(userId: number): Promise<AccountResponse | null> {
    try {
      const res = await HttpService.get<AccountResponse>(`/account/get_by_user_id/${userId}`)
      return res.data as unknown as AccountResponse
    } catch (e) {
      console.error('Erreur getAccountByUserId:', e)
      return null
    }
  }

  static async getLibelleTarif(libelle: string): Promise<PriceLibelleResponse | null> {
    try {
      const res = await HttpService.get<PriceLibelleResponse>(`/price_list/get_by_libelle/${encodeURIComponent(libelle)}`)
      return res.data as unknown as PriceLibelleResponse
    } catch (e) {
      console.error('Erreur getLibelleTarif:', e)
      return null
    }
  }

  static async ajouterCredit(accountId: number, credit: number): Promise<boolean> {
    // Essayer plusieurs variantes car l'API peut attendre un verbe ou un payload différent selon l'environnement
    // Reset last error before attempts
    CreditService.lastError = null
    const attempts: Array<() => Promise<boolean>> = [
      // 1) POST /account/credit - endpoint standard pour créditer des crédits
      async () => {
        await HttpService.post(`/account/credit`, { accountId: Number(accountId), amount: Number(credit) })
        return true
      },
      // 2) POST /account/update_credit - mise à jour générale des crédits (crédit)
      async () => {
        await HttpService.post(`/account/update_credit`, { accountId: Number(accountId), credit: Number(credit), operation: 'credit' })
        return true
      },
      // 3) PATCH /account/{id} - mise à jour partielle du compte
      async () => {
        await HttpService.patch(`/account/${accountId}`, { credit: Number(credit) })
        return true
      },
      // 4) PUT /account/{id}/add - endpoint spécifique au crédit
      async () => {
        await HttpService.put(`/account/add/${accountId}`, { credit: Number(credit) })
        return true
      },
      // 5) POST /account/{id}/credit - crédit par ID de compte
      async () => {
        await HttpService.post(`/account/${accountId}/credit`, { amount: Number(credit) })
        return true
      },
      // 6) POST /account/transaction - enregistrement de transaction générique (crédit)
      async () => {
        await HttpService.post(`/account/transaction`, { 
          accountId: Number(accountId), 
          amount: Number(credit), 
          type: 'credit',
          reason: 'payment_recharge' 
        })
        return true
      },
      // 7) PUT avec query param pour ajout
      async () => {
        await HttpService.put(`/account/add/${accountId}?credit=${encodeURIComponent(String(credit))}`)
        return true
      },
      // 8) POST avec FormData pour compatibilité ancienne API
      async () => {
        const fd = new FormData()
        fd.append('account_id', String(accountId))
        fd.append('amount', String(credit))
        fd.append('operation', 'credit')
        await HttpService.post(`/account/credit`, fd)
        return true
      },
    ]
    console.log(`🏦 [CreditService] AJOUT DE CRÉDITS - Tentative d'ajout de ${credit} crédits au compte ${accountId}`)
    
    for (let i = 0; i < attempts.length; i++) {
      try {
        console.log(`🏦 [CreditService] Tentative ${i + 1}/${attempts.length}`)
        const ok = await attempts[i]()
        if (ok) {
          console.log(`✅ [CreditService] SUCCÈS ajout crédits sur tentative ${i + 1}`)
          return true
        }
      } catch (e: any) {
        const msg = e instanceof HttpError
          ? `HTTP ${e.status} ${e.statusText}${e.data ? ' - ' + (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)) : ''}`
          : (e?.message || String(e))
        CreditService.lastError = msg
        console.warn(`[CreditService] ❌ Credit attempt ${i + 1}/${attempts.length} failed:`, msg)
        
        // Si c'est une erreur d'auth (401/403), pas la peine de continuer
        if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
          console.error('[CreditService] Authentication error, stopping attempts')
          break
        }
        
        // Continue to next attempt pour les autres erreurs
      }
    }
    
    console.error('[CreditService] ❌ All credit attempts failed. Last error:', CreditService.lastError)
    return false
  }

  static async souscrireCredit(accountId: number, credit: number): Promise<boolean> {
    // Essayer plusieurs variantes car l'API peut attendre un verbe ou un payload différent selon l'environnement
    // Reset last error before attempts
    CreditService.lastError = null
    
    console.log('💳 [CreditService] Tentative de débit de', credit, 'crédit(s) pour le compte', accountId)
    
    const attempts: Array<() => Promise<boolean>> = [
      // 1) PUT /account/spent/{id}?credit={amount} - ENDPOINT CORRECT DE L'API
      async () => {
        console.log('💳 [CreditService] Tentative #1: PUT /account/spent avec query param')
        await HttpService.put(`/account/spent/${accountId}?credit=${encodeURIComponent(String(credit))}`)
        console.log('✅ [CreditService] Succès avec PUT /account/spent + query param')
        return true
      },
      // 2) PUT /account/spent/{id} avec body JSON
      async () => {
        console.log('💳 [CreditService] Tentative #2: PUT /account/spent avec body')
        await HttpService.put(`/account/spent/${accountId}`, { credit: Number(credit) })
        console.log('✅ [CreditService] Succès avec PUT /account/spent + body')
        return true
      },
      // 3) POST /account/debit - endpoint standard pour débiter des crédits
      async () => {
        console.log('💳 [CreditService] Tentative #3: POST /account/debit')
        await HttpService.post(`/account/debit`, { accountId: Number(accountId), amount: Number(credit) })
        console.log('✅ [CreditService] Succès avec POST /account/debit')
        return true
      },
      // 4) POST /account/update_credit - mise à jour générale des crédits
      async () => {
        console.log('💳 [CreditService] Tentative #4: POST /account/update_credit')
        await HttpService.post(`/account/update_credit`, { accountId: Number(accountId), credit: -Number(credit), operation: 'debit' })
        console.log('✅ [CreditService] Succès avec POST /account/update_credit')
        return true
      },
      // 5) PATCH /account/{id} - mise à jour partielle du compte
      async () => {
        console.log('💳 [CreditService] Tentative #5: PATCH /account')
        await HttpService.patch(`/account/${accountId}`, { credit_spent: Number(credit) })
        console.log('✅ [CreditService] Succès avec PATCH /account')
        return true
      },
      // 6) POST /account/{id}/debit - débit par ID de compte
      async () => {
        console.log('💳 [CreditService] Tentative #6: POST /account/{id}/debit')
        await HttpService.post(`/account/${accountId}/debit`, { amount: Number(credit) })
        console.log('✅ [CreditService] Succès avec POST /account/{id}/debit')
        return true
      },
      // 7) POST /account/transaction - enregistrement de transaction générique
      async () => {
        console.log('💳 [CreditService] Tentative #7: POST /account/transaction')
        await HttpService.post(`/account/transaction`, { 
          accountId: Number(accountId), 
          amount: Number(credit), 
          type: 'debit',
          reason: 'reservation_check' 
        })
        console.log('✅ [CreditService] Succès avec POST /account/transaction')
        return true
      },
      // 8) POST avec FormData pour compatibilité ancienne API
      async () => {
        const fd = new FormData()
        fd.append('account_id', String(accountId))
        fd.append('amount', String(credit))
        fd.append('operation', 'debit')
        await HttpService.post(`/account/debit`, fd)
        return true
      },
    ]
    console.log(`[CreditService] Attempting to debit ${credit} credits from account ${accountId}`)
    
    for (let i = 0; i < attempts.length; i++) {
      try {
        console.log(`[CreditService] Attempt ${i + 1}/${attempts.length}`)
        const ok = await attempts[i]()
        if (ok) {
          console.log(`[CreditService] ✅ Debit successful on attempt ${i + 1}`)
          return true
        }
      } catch (e: any) {
        const msg = e instanceof HttpError
          ? `HTTP ${e.status} ${e.statusText}${e.data ? ' - ' + (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)) : ''}`
          : (e?.message || String(e))
        CreditService.lastError = msg
        console.warn(`[CreditService] ❌ Debit attempt ${i + 1}/${attempts.length} failed:`, msg)
        
        // Si c'est une erreur d'auth (401/403), pas la peine de continuer
        if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
          console.error('[CreditService] Authentication error, stopping attempts')
          break
        }
        
        // Continue to next attempt pour les autres erreurs
      }
    }
    
    console.error('[CreditService] ❌ All debit attempts failed. Last error:', CreditService.lastError)
    return false
  }
}
